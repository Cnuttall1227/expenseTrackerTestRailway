import React, { useState, useEffect } from "react";
import DisplayExpenses from "./components/Expenses/DisplayExpenses";
import NewExpense from "./components/NewExpense/NewExpense";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import { getExpenses, addExpense } from "./services/expenseService";
import { getCategories } from "./services/categoryService";

const App = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  // Check if user is logged in on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Load expenses + categories from backend when logged in
  useEffect(() => {
    if (!token) return;

    async function fetchData() {
      try {
        const [expenseData, categoryData] = await Promise.all([
          getExpenses(token),
          getCategories(token),
        ]);
        const formatted = expenseData.map((exp) => ({
          id: exp._id,
          title: exp.title,
          amount: exp.amount,
          date: new Date(exp.date),
          category: exp.categoryId?.name || "Uncategorized",
        }));
        setExpenses(formatted);
        setCategories(categoryData);
      } catch (err) {
        setError(err.message);
        // If unauthorized, clear token
        if (err.message.includes('authorized')) {
          localStorage.removeItem('token');
          setToken(null);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token]);

  // Add expense to backend + local state
  const addExpenseHandler = async (expense) => {
    try {
      const saved = await addExpense(expense, token);
      setExpenses((prev) => [
        { ...saved, id: saved._id, date: new Date(saved.date) },
        ...prev,
      ]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = (newToken) => {
    setToken(newToken);
    setLoading(true);
  };

  const handleRegister = (newToken) => {
    setToken(newToken);
    setLoading(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setExpenses([]);
    setCategories([]);
  };

  // Show login/register if no token
  if (!token) {
    return authMode === 'login' ? (
      <Login 
        onLogin={handleLogin} 
        onToggleMode={() => setAuthMode('register')} 
      />
    ) : (
      <Register 
        onRegister={handleRegister} 
        onToggleMode={() => setAuthMode('login')} 
      />
    );
  }

  if (loading) return <p>Loading data...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div>
      <div style={{ textAlign: 'right', padding: '1rem' }}>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <NewExpense onAddExpense={addExpenseHandler} categories={categories} />
      <DisplayExpenses expenses_list={expenses} />
    </div>
  );
};

export default App;
