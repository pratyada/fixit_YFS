import { useState, useMemo } from 'react';
import { Plus, Trash2, Search, Star, X } from 'lucide-react';
import { usePatientData } from '../../hooks/usePatientData';
import { useAuth } from '../../contexts/AuthContext';
import { addFoodEntry, deleteFoodEntry } from '../../lib/firestore';
import { generateId } from '../../utils/storage';
import { COMMON_FOODS } from '../../data/common-foods';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const today = () => new Date().toISOString().split('T')[0];

export default function FoodLogger() {
  const { user } = useAuth();
  const [entries, setEntries] = usePatientData('food_entries', []);
  const [name, setName] = useState('');
  const [meal, setMeal] = useState('Lunch');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const todayEntries = useMemo(() => entries.filter(e => e.date === today()), [entries]);
  const todayTotals = useMemo(() => ({
    calories: todayEntries.reduce((s, e) => s + (e.calories || 0), 0),
    protein: todayEntries.reduce((s, e) => s + (e.protein || 0), 0),
    carbs: todayEntries.reduce((s, e) => s + (e.carbs || 0), 0),
    fat: todayEntries.reduce((s, e) => s + (e.fat || 0), 0),
  }), [todayEntries]);

  const searchResults = useMemo(() => {
    if (!searchQuery) return COMMON_FOODS.slice(0, 8);
    const q = searchQuery.toLowerCase();
    return COMMON_FOODS.filter(f => f.name.toLowerCase().includes(q)).slice(0, 8);
  }, [searchQuery]);

  const fillFromFood = (food) => {
    setName(food.name);
    setCalories(String(food.calories));
    setProtein(String(food.protein));
    setCarbs(String(food.carbs));
    setFat(String(food.fat));
    setShowSearch(false);
    setSearchQuery('');
  };

  const handleAdd = async () => {
    if (!name || !calories) return;
    const entry = {
      id: generateId(),
      date: today(),
      timestamp: new Date().toISOString(),
      meal,
      name,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
    };
    setEntries(prev => [entry, ...prev]);
    if (user?.uid) {
      try { await addFoodEntry(user.uid, entry); } catch (e) { console.error(e); }
    }
    setName(''); setCalories(''); setProtein(''); setCarbs(''); setFat('');
  };

  const handleDelete = async (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    if (user?.uid) {
      try { await deleteFoodEntry(user.uid, id); } catch (e) { console.error(e); }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Daily macro bars */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '16px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text)', marginBottom: '10px' }}>
          Today's Macros
        </div>
        <MacroBar label="Protein" value={todayTotals.protein} unit="g" color="#1565C0" />
        <MacroBar label="Carbs" value={todayTotals.carbs} unit="g" color="#F57C00" />
        <MacroBar label="Fat" value={todayTotals.fat} unit="g" color="#E53935" />
        <div style={{ marginTop: '8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
          {todayTotals.calories} cal total
        </div>
      </div>

      {/* Quick search */}
      <button onClick={() => setShowSearch(!showSearch)} style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 16px', borderRadius: '10px',
        background: 'white', border: '1px solid var(--color-border)',
        color: 'var(--color-text)', fontSize: '0.82rem', cursor: 'pointer',
        width: '100%', textAlign: 'left',
      }}>
        <Search size={14} /> Quick add from common foods...
      </button>

      {showSearch && (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <input type="text" placeholder="Search foods..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.82rem' }} />
            <button onClick={() => setShowSearch(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '240px', overflowY: 'auto' }}>
            {searchResults.map((f, i) => (
              <button key={i} onClick={() => fillFromFood(f)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', borderRadius: '8px', background: 'var(--color-bg-alt)',
                border: 'none', cursor: 'pointer', fontSize: '0.78rem', textAlign: 'left', width: '100%',
              }}>
                <span style={{ color: 'var(--color-secondary)', fontWeight: 500 }}>{f.name}</span>
                <span style={{ color: 'var(--color-text)', fontSize: '0.7rem' }}>{f.calories} cal</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Entry form */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '16px' }}>
        <input type="text" placeholder="Food name" value={name} onChange={e => setName(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '0.85rem', marginBottom: '10px', boxSizing: 'border-box', maxWidth: '100%' }} />

        {/* Meal pills */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {MEALS.map(m => (
            <button key={m} onClick={() => setMeal(m)} style={{
              padding: '6px 14px', borderRadius: '50px',
              background: meal === m ? 'var(--color-accent)' : 'white',
              color: meal === m ? 'white' : 'var(--color-text)',
              border: `1px solid ${meal === m ? 'var(--color-accent)' : 'var(--color-border)'}`,
              fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
            }}>
              {m}
            </button>
          ))}
        </div>

        {/* Macro inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <NumInput label="Calories" value={calories} onChange={setCalories} />
          <NumInput label="Protein (g)" value={protein} onChange={setProtein} />
          <NumInput label="Carbs (g)" value={carbs} onChange={setCarbs} />
          <NumInput label="Fat (g)" value={fat} onChange={setFat} />
        </div>

        <button onClick={handleAdd} disabled={!name || !calories} style={{
          width: '100%', padding: '11px', borderRadius: '10px',
          background: name && calories ? 'var(--color-secondary)' : '#E0E0E0',
          border: 'none', color: 'white', fontSize: '0.82rem', fontWeight: 700,
          cursor: name && calories ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          <Plus size={16} /> Add Entry
        </button>
      </div>

      {/* Today's entries by meal */}
      {MEALS.map(m => {
        const mealEntries = todayEntries.filter(e => e.meal === m);
        if (!mealEntries.length) return null;
        return (
          <div key={m}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text)', marginBottom: '6px' }}>{m}</div>
            {mealEntries.map(e => (
              <div key={e.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: '10px', background: 'white',
                border: '1px solid var(--color-border)', marginBottom: '6px',
              }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{e.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-text)', marginTop: '2px' }}>
                    {e.calories} cal &bull; P:{e.protein}g &bull; C:{e.carbs}g &bull; F:{e.fat}g
                  </div>
                </div>
                <button onClick={() => handleDelete(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E53935', padding: '4px' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function NumInput({ label, value, onChange }) {
  return (
    <div>
      <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text)', marginBottom: '3px' }}>{label}</div>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder="0"
        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.82rem', boxSizing: 'border-box', maxWidth: '100%' }} />
    </div>
  );
}

function MacroBar({ label, value, unit, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
      <div style={{ width: '50px', fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text)' }}>{label}</div>
      <div style={{ flex: 1, height: '6px', background: 'var(--color-bg-alt)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, value)}%`, background: color, borderRadius: '3px', transition: 'width 0.3s' }} />
      </div>
      <div style={{ width: '45px', textAlign: 'right', fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{value}{unit}</div>
    </div>
  );
}
