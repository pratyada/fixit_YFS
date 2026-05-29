// ─── Health Insights Engine ───
// Rule-based v1 — generates insights from food, water, body, and exercise data.
// Designed to be swapped for Claude API calls later.

const today = () => new Date().toISOString().split('T')[0];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function filterByDateRange(entries, days) {
  const cutoff = daysAgo(days);
  return entries.filter(e => (e.date || e.timestamp?.split?.('T')?.[0] || '') >= cutoff);
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function generateDailySummary(foodEntries, waterEntries, sessions, targets) {
  const todayStr = today();
  const todayFood = foodEntries.filter(e => e.date === todayStr);
  const todayWater = waterEntries.filter(e => e.date === todayStr);
  const todaySessions = sessions.filter(s => s.date === todayStr);

  const calories = todayFood.reduce((sum, e) => sum + (e.calories || 0), 0);
  const protein = todayFood.reduce((sum, e) => sum + (e.protein || 0), 0);
  const carbs = todayFood.reduce((sum, e) => sum + (e.carbs || 0), 0);
  const fat = todayFood.reduce((sum, e) => sum + (e.fat || 0), 0);
  const water = todayWater.reduce((sum, e) => sum + (e.amount || 0), 0);

  return {
    calories: { consumed: calories, target: targets.dailyCalories || 2200 },
    protein: { consumed: protein, target: targets.dailyProtein || 170 },
    carbs: { consumed: carbs, target: targets.dailyCarbs || 250 },
    fat: { consumed: fat, target: targets.dailyFat || 70 },
    water: { consumed: water, target: targets.dailyWater || 3000 },
    exerciseCount: todaySessions.length,
    mealsLogged: todayFood.length,
  };
}

export function generateWeeklyTrends(bodyMetrics, foodEntries, waterEntries) {
  const weekFood = filterByDateRange(foodEntries, 7);
  const prevWeekFood = filterByDateRange(foodEntries, 14).filter(
    e => !weekFood.includes(e)
  );

  // Daily calorie averages
  const dailyCalories = {};
  weekFood.forEach(e => {
    dailyCalories[e.date] = (dailyCalories[e.date] || 0) + (e.calories || 0);
  });
  const avgCalories = avg(Object.values(dailyCalories));

  const dailyProtein = {};
  weekFood.forEach(e => {
    dailyProtein[e.date] = (dailyProtein[e.date] || 0) + (e.protein || 0);
  });
  const avgProtein = avg(Object.values(dailyProtein));

  // Water
  const dailyWater = {};
  const weekWater = filterByDateRange(waterEntries, 7);
  weekWater.forEach(e => {
    dailyWater[e.date] = (dailyWater[e.date] || 0) + (e.amount || 0);
  });
  const avgWater = avg(Object.values(dailyWater));

  // Weight trend
  const recentMetrics = filterByDateRange(bodyMetrics, 14).filter(m => m.weight);
  let weightChange = null;
  if (recentMetrics.length >= 2) {
    const sorted = [...recentMetrics].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    weightChange = sorted[sorted.length - 1].weight - sorted[0].weight;
  }

  return {
    avgCalories: Math.round(avgCalories),
    avgProtein: Math.round(avgProtein),
    avgWater: Math.round(avgWater),
    weightChange,
    daysTracked: Object.keys(dailyCalories).length,
  };
}

export function generateInsights(foodEntries, waterEntries, bodyMetrics, sessions, targets) {
  const insights = [];
  const weekFood = filterByDateRange(foodEntries, 7);
  const weekWater = filterByDateRange(waterEntries, 7);
  const todayStr = today();

  // Protein tracking
  const dailyProtein = {};
  weekFood.forEach(e => {
    dailyProtein[e.date] = (dailyProtein[e.date] || 0) + (e.protein || 0);
  });
  const proteinTarget = targets.dailyProtein || 170;
  const lowProteinDays = Object.values(dailyProtein).filter(p => p < proteinTarget * 0.8).length;
  if (lowProteinDays >= 3) {
    insights.push({
      type: 'warning',
      icon: '🥩',
      title: 'Protein deficit',
      description: `Your protein intake was below target ${lowProteinDays} of the last 7 days. Aim for ${proteinTarget}g daily to support muscle maintenance.`,
    });
  } else if (Object.keys(dailyProtein).length >= 5) {
    const avgP = avg(Object.values(dailyProtein));
    if (avgP >= proteinTarget * 0.9) {
      insights.push({
        type: 'success',
        icon: '💪',
        title: 'Protein on track',
        description: `Great job! Averaging ${Math.round(avgP)}g protein/day this week — right on target.`,
      });
    }
  }

  // Calorie tracking
  const dailyCalories = {};
  weekFood.forEach(e => {
    dailyCalories[e.date] = (dailyCalories[e.date] || 0) + (e.calories || 0);
  });
  const calTarget = targets.dailyCalories || 2200;
  const overCalDays = Object.values(dailyCalories).filter(c => c > calTarget * 1.15).length;
  if (overCalDays >= 3) {
    insights.push({
      type: 'warning',
      icon: '📊',
      title: 'Calorie surplus detected',
      description: `You exceeded your calorie target ${overCalDays} days this week. Review your portions if fat loss is a goal.`,
    });
  }

  // Water
  const dailyWaterAmounts = {};
  weekWater.forEach(e => {
    dailyWaterAmounts[e.date] = (dailyWaterAmounts[e.date] || 0) + (e.amount || 0);
  });
  const waterTarget = targets.dailyWater || 3000;
  const lowWaterDays = Object.values(dailyWaterAmounts).filter(w => w < waterTarget * 0.6).length;
  if (lowWaterDays >= 3) {
    insights.push({
      type: 'warning',
      icon: '💧',
      title: 'Hydration low',
      description: `Water intake was under 60% of your target ${lowWaterDays} days this week. Dehydration affects performance and recovery.`,
    });
  }

  // Body composition
  const recentMetrics = filterByDateRange(bodyMetrics, 30).filter(m => m.weight);
  if (recentMetrics.length >= 2) {
    const sorted = [...recentMetrics].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const weightDiff = last.weight - first.weight;

    if (weightDiff < -0.5) {
      insights.push({
        type: 'success',
        icon: '📉',
        title: `Weight trending down`,
        description: `Down ${Math.abs(weightDiff).toFixed(1)} lbs over the last ${sorted.length} measurements. ${last.muscleMass && first.muscleMass && last.muscleMass >= first.muscleMass ? 'Muscle mass maintained — great work!' : 'Monitor muscle mass to ensure healthy fat loss.'}`,
      });
    } else if (weightDiff > 1) {
      insights.push({
        type: 'info',
        icon: '📈',
        title: 'Weight trending up',
        description: `Up ${weightDiff.toFixed(1)} lbs recently. ${last.bodyFatPct && first.bodyFatPct && last.bodyFatPct <= first.bodyFatPct ? 'Body fat steady — likely muscle gain!' : 'Check if this aligns with your goals.'}`,
      });
    }
  }

  // Exercise consistency
  const weekSessions = filterByDateRange(sessions, 7);
  const exerciseDays = new Set(weekSessions.map(s => s.date)).size;
  if (exerciseDays >= 5) {
    insights.push({
      type: 'success',
      icon: '🔥',
      title: 'Consistent training',
      description: `${exerciseDays} active days this week. Consistency is the #1 predictor of results.`,
    });
  } else if (exerciseDays <= 1) {
    insights.push({
      type: 'warning',
      icon: '🏋️',
      title: 'Low activity',
      description: `Only ${exerciseDays} active day(s) this week. Even 20 minutes of movement helps.`,
    });
  }

  // No data yet
  if (weekFood.length === 0) {
    insights.push({
      type: 'info',
      icon: '📝',
      title: 'Start logging food',
      description: 'Log your meals to get personalized nutrition insights and track your macros.',
    });
  }

  return insights;
}
