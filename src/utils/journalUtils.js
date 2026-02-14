export const formatCurrency = (val) => {
    let num = Number(val);
    if (isNaN(num)) return '₹0.00';
    // Handle negative zero and precision issues
    if (Math.abs(num) < 0.005) num = 0;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(num);
};

export const calculateTotals = (trades) => {
    return trades.reduce((acc, trade) => {
        const investment = parseFloat(trade.investment) || 0;
        const pnl = parseFloat(trade.pnl) || 0;
        return {
            investment: acc.investment + investment,
            pnl: acc.pnl + pnl,
            count: acc.count + 1
        };
    }, { investment: 0, pnl: 0, count: 0 });
};

const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

export const groupTrades = (rows) => {
    const groups = {};

    rows.forEach(row => {
        if (!row.date) return;
        const date = new Date(row.date);
        if (isNaN(date.getTime())) return;

        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthLabel = date.toLocaleDateString('default', { month: 'long', year: 'numeric' });

        // Week Info
        const weekNum = getWeekNumber(date);
        const weekKey = `${monthKey}-W${weekNum}`;
        const weekLabel = `Week ${weekNum}`;

        // Day Info
        const dayKey = row.date; // YYYY-MM-DD
        const dayLabel = date.toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'short' });

        // Initialize Month
        if (!groups[monthKey]) {
            groups[monthKey] = {
                key: monthKey,
                label: monthLabel,
                level: 'month',
                weeks: {},
                stats: { investment: 0, pnl: 0, count: 0 }
            };
        }

        // Initialize Week
        if (!groups[monthKey].weeks[weekKey]) {
            groups[monthKey].weeks[weekKey] = {
                key: weekKey,
                label: weekLabel,
                level: 'week',
                days: {},
                stats: { investment: 0, pnl: 0, count: 0 }
            };
        }

        // Initialize Day
        if (!groups[monthKey].weeks[weekKey].days[dayKey]) {
            groups[monthKey].weeks[weekKey].days[dayKey] = {
                key: dayKey,
                label: dayLabel,
                level: 'day',
                trades: [],
                stats: { investment: 0, pnl: 0, count: 0 }
            };
        }

        // Add Trade
        groups[monthKey].weeks[weekKey].days[dayKey].trades.push(row);

        // Update Stats (Day)
        const inv = parseFloat(row.investment) || 0;
        const pl = parseFloat(row.pnl) || 0;

        const updateStats = (stats) => {
            stats.investment += inv;
            stats.pnl += pl;
            stats.count += 1;
        };

        updateStats(groups[monthKey].weeks[weekKey].days[dayKey].stats);
        updateStats(groups[monthKey].weeks[weekKey].stats);
        updateStats(groups[monthKey].stats);
    });

    // Convert objects to arrays and sort (Oldest First)
    const sortedMonths = Object.values(groups).sort((a, b) => a.key.localeCompare(b.key));

    sortedMonths.forEach(month => {
        month.children = Object.values(month.weeks).sort((a, b) => a.key.localeCompare(b.key));
        month.children.forEach(week => {
            week.children = Object.values(week.days).sort((a, b) => a.key.localeCompare(b.key));
            delete week.days;
        });
        delete month.weeks;
    });

    return sortedMonths;
};
