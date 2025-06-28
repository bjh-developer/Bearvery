import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { PlusCircle, CheckCircle, Circle, Trash2, Star } from 'lucide-react';
import TaskCompletionAnimation from './TaskCompletionAnimation';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: string;
  due_date: string | null;
  user_id: string;
  created_at: string; // Added created_at field
}

const categories = [
  { id: 'work', name: 'Work', color: 'bg-blue-500' },
  { id: 'personal', name: 'Personal', color: 'bg-green-500' },
  { id: 'urgent', name: 'Urgent', color: 'bg-red-500' },
  { id: 'recurring', name: 'Recurring', color: 'bg-purple-500' },
];

const TodoList = () => {
  const { user } = useAuthStore();
  const { completeTask } = useGamificationStore();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('work');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);

  // Fetch todos on component mount
  useEffect(() => {
    if (user) {
      fetchTodos();
    }
  }, [user]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setTodos(data);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTodo.trim() || !user) return;
    
    const newTodoItem: Todo = {
      id: uuidv4(),
      text: newTodo,
      completed: false,
      category: selectedCategory,
      due_date: dueDate || null,
      user_id: user.id,
      created_at: new Date().toISOString(), // Add created_at field here
    };
    
    try {
      const { error } = await supabase
        .from('todos')
        .insert([newTodoItem]);
      
      if (error) throw error;
      
      // Update local state
      setTodos([newTodoItem, ...todos]);
      setNewTodo('');
      setDueDate('');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const toggleTodoStatus = async (id: string) => {
    const todoToUpdate = todos.find(todo => todo.id === id);
    if (!todoToUpdate) return;
    
    const updatedTodo = { ...todoToUpdate, completed: !todoToUpdate.completed };
    
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: updatedTodo.completed })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setTodos(todos.map(todo => (todo.id === id ? updatedTodo : todo)));
      
      // If task was completed, trigger gamification
      if (updatedTodo.completed) {
        setShowCompletionAnimation(true);
        await completeTask();
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const filteredTodos = filter === 'all' 
    ? todos 
    : filter === 'completed' 
      ? todos.filter(todo => todo.completed) 
      : todos.filter(todo => !todo.completed);

  const completedToday = todos.filter(todo => {
    const createdAtDate = new Date(todo.created_at || ''); // Ensure valid date
    return todo.completed && createdAtDate.toDateString() === new Date().toDateString();
  }).length;

  return (
    <div className="h-full flex flex-col">
      {/* Daily Progress */}
      {completedToday > 0 && (
        <div className="mb-4 bg-green-500/20 border border-green-500/50 rounded-lg p-3 flex items-center">
          <Star className="text-yellow-400 mr-2" size={16} />
          <span className="text-sm">
            Great job! You've completed {completedToday} task{completedToday > 1 ? 's' : ''} today!
          </span>
        </div>
      )}

      <form onSubmit={addTodo} className="mb-4">
        <div className="flex mb-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 bg-white/10 border border-white/20 rounded-l-md px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/30"
          />
          <button
            type="submit"
            className="bg-white/20 hover:bg-white/30 px-3 rounded-r-md text-white"
          >
            <PlusCircle size={18} />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className={`px-2 py-1 rounded-md text-xs ${
                selectedCategory === category.id
                  ? `${category.color} text-white`
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30"
        />
      </form>
      
      <div className="flex justify-between mb-2">
        <div className="text-sm opacity-80">{todos.length} tasks</div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`text-xs px-2 py-1 rounded-md ${
              filter === 'all' ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`text-xs px-2 py-1 rounded-md ${
              filter === 'active' ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`text-xs px-2 py-1 rounded-md ${
              filter === 'completed' ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            Completed
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-4 text-white/70">Loading tasks...</div>
        ) : filteredTodos.length === 0 ? (
          <div className="text-center py-4 text-white/70">No tasks to display</div>
        ) : (
          <ul className="space-y-2">
            {filteredTodos.map((todo) => {
              const category = categories.find(c => c.id === todo.category);
              
              return (
                <li key={todo.id} className="flex items-center group">
                  <button
                    onClick={() => toggleTodoStatus(todo.id)}
                    className="p-1 mr-2"
                  >
                    {todo.completed ? (
                      <CheckCircle size={18} className="text-green-400" />
                    ) : (
                      <Circle size={18} className="text-white/70" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className={`${todo.completed ? 'line-through text-white/50' : 'text-white'}`}>
                      {todo.text}
                    </div>
                    
                    <div className="flex items-center text-xs text-white/50 mt-1">
                      {category && (
                        <span className={`${category.color} rounded-full w-2 h-2 mr-1`}></span>
                      )}
                      <span>{category?.name}</span>
                      
                      {todo.due_date && (
                        <span className="ml-2">Due: {new Date(todo.due_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-white/70 hover:text-white"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Task Completion Animation */}
      <TaskCompletionAnimation
        show={showCompletionAnimation}
        onComplete={() => setShowCompletionAnimation(false)}
      />
    </div>
  );
};

export default TodoList;
