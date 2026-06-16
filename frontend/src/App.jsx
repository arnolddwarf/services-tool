import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  Settings, 
  History, 
  LayoutDashboard, 
  Trash2, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle,
  Coins,
  FileText,
  Calendar,
  User,
  Wrench,
  Edit2
} from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE = '/api';

const legendPaddingPlugin = {
  id: 'customLegendPadding',
  beforeInit(chart) {
    const originalFit = chart.legend.fit;
    chart.legend.fit = function fit() {
      originalFit.bind(chart.legend)();
      this.height += 25; // Añade 25px de margen inferior debajo de la leyenda
    };
  }
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const formatDueDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
};

function CustomDatePicker({ value, onChange, contextYear, contextMonth }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(contextYear);
  const [currentMonth, setCurrentMonth] = useState(contextMonth);
  const containerRef = useRef(null);

  // Sync with context if it changes
  useEffect(() => {
    setCurrentYear(contextYear);
    setCurrentMonth(contextMonth);
  }, [contextYear, contextMonth]);

  // Parse current value
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;
  const selectedDay = selectedDate ? selectedDate.getDate() : null;
  const selectedMonth = selectedDate ? selectedDate.getMonth() + 1 : null;
  const selectedYear = selectedDate ? selectedDate.getFullYear() : null;

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay();
  // Shift so Monday is 0: (firstDayIndex + 6) % 7
  const startOffset = (firstDayIndex + 6) % 7;

  const handleSelectDay = (day) => {
    const formattedDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Format date for display: DD/MM/YYYY
  const displayValue = selectedDate 
    ? `${selectedDay.toString().padStart(2, '0')}/${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`
    : '';

  const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div className="input-wrapper" onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
        <input 
          type="text" 
          className="form-control datepicker-input" 
          placeholder="Sin fecha" 
          value={displayValue} 
          readOnly 
        />
        <Calendar 
          className="datepicker-icon"
          size={14} 
          style={{ 
            color: isOpen ? 'var(--primary)' : 'var(--text-secondary)'
          }} 
        />
      </div>

      {isOpen && (
        <>
          <div className="mobile-calendar-backdrop" onClick={() => setIsOpen(false)} />
          <div className="glass-card calendar-popup-card">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <button type="button" className="month-nav-btn" onClick={handlePrevMonth} style={{ padding: '2px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <ChevronLeft size={16} />
              </button>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                {MONTH_NAMES[currentMonth - 1]} {currentYear}
              </div>
              <button type="button" className="month-nav-btn" onClick={handleNextMonth} style={{ padding: '2px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Week Days Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', marginBottom: '4px' }}>
              {weekDays.map(wd => (
                <span key={wd} style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {wd}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {/* Start Offset Empty Cells */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <span key={`empty-${i}`} />
              ))}

              {/* Days Cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected = selectedDay === dayNum && selectedMonth === currentMonth && selectedYear === currentYear;
                
                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    onClick={() => handleSelectDay(dayNum)}
                    style={{
                      border: 'none',
                      background: isSelected ? 'var(--primary)' : 'transparent',
                      color: isSelected ? '#fff' : 'var(--text-primary)',
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? '700' : '400',
                      padding: '6px 0',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.1s'
                    }}
                    onMouseOver={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }}
                    onMouseOut={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Footer Clear Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-outline btn-sm" 
                style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                onClick={handleClear}
              >
                Borrar Fecha
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CustomSelect({ value, onChange, options, style }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const handleOptionKeyDown = (e, val) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(val);
      setIsOpen(false);
      containerRef.current?.querySelector('.custom-select-trigger')?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      containerRef.current?.querySelector('.custom-select-trigger')?.focus();
    }
  };

  return (
    <div ref={containerRef} className="custom-select-container" style={style}>
      <div 
        className="form-control custom-select-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedOption ? selectedOption.label : ''}</span>
        <ChevronRight 
          className="custom-select-chevron"
          size={16} 
          style={{ 
            transform: isOpen ? 'rotate(-90deg)' : 'rotate(90deg)'
          }} 
        />
      </div>

      {isOpen && (
        <div className="custom-select-dropdown" role="listbox">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                onKeyDown={(e) => handleOptionKeyDown(e, opt.value)}
                tabIndex={0}
                role="option"
                aria-selected={isSelected}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function App() {
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [services, setServices] = useState([]);
  const [rules, setRules] = useState([]);
  
  // Selection state
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(6); // June default
  
  // App navigation tabs
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Expense Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalYear, setModalYear] = useState(2026);
  const [modalMonth, setModalMonth] = useState(6);
  // Stores { [service_id]: { amount: string, due_date: string } }
  const [modalItems, setModalItems] = useState({});

  // Service Modal / Form state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceId, setServiceId] = useState(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceSuministro, setServiceSuministro] = useState('');
  const [serviceTitular, setServiceTitular] = useState('');
  
  // Member management state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberId, setMemberId] = useState(null);
  const [memberName, setMemberName] = useState('');
  
  // Service configuration rules state (local copy for edits: { [service_id]: [member_id, ...] })
  const [tempRules, setTempRules] = useState({});

  // Notifications/Errors
  const [toast, setToast] = useState(null);

  // Custom Confirmation Dialog State
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  // Pre-load existing data for the selected modalYear & modalMonth
  useEffect(() => {
    if (isModalOpen) {
      const existing = expenses.find(e => e.year === modalYear && e.month === modalMonth);
      const itemsMap = {};
      services.forEach(s => {
        const match = existing ? existing.items.find(i => i.service_id === s.id) : null;
        itemsMap[s.id] = {
          amount: match ? match.amount.toString() : '',
          due_date: match ? match.due_date : ''
        };
      });
      setModalItems(itemsMap);
    }
  }, [modalYear, modalMonth, isModalOpen, expenses, services]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const [expRes, memRes, servRes, ruleRes] = await Promise.all([
        fetch(`${API_BASE}/expenses`),
        fetch(`${API_BASE}/members`),
        fetch(`${API_BASE}/services`),
        fetch(`${API_BASE}/rules`)
      ]);

      const expData = await expRes.json();
      const memData = await memRes.json();
      const servData = await servRes.json();
      const ruleData = await ruleRes.json();

      setExpenses(expData);
      setMembers(memData);
      setServices(servData);
      setRules(ruleData);

      // Structure rules into object by service ID
      const rulesObj = {};
      servData.forEach(s => {
        rulesObj[s.id] = [];
      });
      ruleData.forEach(r => {
        if (!rulesObj[r.service_id]) {
          rulesObj[r.service_id] = [];
        }
        rulesObj[r.service_id].push(r.member_id);
      });
      setTempRules(rulesObj);

      // Set default selected month/year to latest expense if available
      if (expData.length > 0) {
        setSelectedYear(expData[0].year);
        setSelectedMonth(expData[0].month);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Error de conexión con el servidor', 'danger');
    }
  };

  // Find current month's record
  const currentExpense = expenses.find(e => e.year === selectedYear && e.month === selectedMonth) || {
    items: []
  };

  const getParticipantsList = (serviceId) => {
    const participantIds = tempRules[serviceId] || [];
    return members.filter(m => participantIds.includes(m.id));
  };

  // Calculate dynamic breakdowns
  const calculateBreakdown = () => {
    const breakdown = {};
    // Initialize members
    members.forEach(m => {
      breakdown[m.id] = {
        name: m.name,
        total: 0,
        details: []
      };
    });

    // Loop through each active service
    services.forEach(service => {
      const participants = getParticipantsList(service.id);
      const expenseItem = currentExpense.items.find(item => item.service_id === service.id);
      const amount = expenseItem ? expenseItem.amount : 0;

      if (participants.length > 0 && amount > 0) {
        const share = amount / participants.length;
        participants.forEach(p => {
          if (breakdown[p.id]) {
            breakdown[p.id].total += share;
            breakdown[p.id].details.push(
              `${service.name}: S/ ${share.toFixed(2)} (${1}/${participants.length})`
            );
          }
        });
      }
    });

    return Object.values(breakdown).sort((a, b) => b.total - a.total);
  };

  const memberBreakdown = calculateBreakdown();
  const totalExpense = currentExpense.items.reduce((sum, item) => sum + item.amount, 0);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  // Submit Expense Modal
  const handleOpenAddModal = (existing = null) => {
    if (existing) {
      setModalYear(existing.year);
      setModalMonth(existing.month);
      // Map items into state
      const itemsMap = {};
      services.forEach(s => {
        const match = existing.items.find(i => i.service_id === s.id);
        itemsMap[s.id] = {
          amount: match ? match.amount.toString() : '',
          due_date: match ? match.due_date : ''
        };
      });
      setModalItems(itemsMap);
    } else {
      setModalYear(selectedYear);
      setModalMonth(selectedMonth);
      const itemsMap = {};
      services.forEach(s => {
        itemsMap[s.id] = { amount: '', due_date: '' };
      });
      setModalItems(itemsMap);
    }
    setIsModalOpen(true);
  };

  const handleModalItemChange = (serviceId, field, value) => {
    setModalItems(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: value
      }
    }));
  };

  const handleSaveExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      // Structure payload: [{ service_id, amount, due_date }]
      const payloadItems = Object.keys(modalItems).map(id => ({
        service_id: parseInt(id),
        amount: modalItems[id].amount,
        due_date: modalItems[id].due_date
      }));

      const response = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: modalYear,
          month: modalMonth,
          items: payloadItems
        })
      });

      const data = await response.json();
      if (data.success) {
        showToast('Gastos registrados correctamente!');
        setIsModalOpen(false);
        fetchData();
        setSelectedYear(modalYear);
        setSelectedMonth(modalMonth);
      } else {
        showToast(data.error || 'Error al guardar los gastos', 'danger');
      }
    } catch (error) {
      console.error(error);
      showToast('Error al procesar la solicitud', 'danger');
    }
  };

  const handleDeleteExpense = async (id, year, month) => {
    const monthName = MONTH_NAMES[month - 1];
    setConfirmConfig({
      message: `¿Estás seguro de eliminar por completo el registro de ${monthName} ${year}? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_BASE}/expenses/${id}`, {
            method: 'DELETE'
          });

          const data = await response.json();
          if (response.ok && data.success) {
            showToast(`Registro de ${monthName} ${year} eliminado.`);
            fetchData();
          } else {
            showToast(data.error || 'Error al eliminar el registro', 'danger');
          }
        } catch (e) {
          console.error(e);
          showToast('Error de conexión', 'danger');
        }
      }
    });
  };

  // Member Management
  const handleOpenMemberModal = (existing = null) => {
    if (existing) {
      setMemberId(existing.id);
      setMemberName(existing.name);
    } else {
      setMemberId(null);
      setMemberName('');
    }
    setIsMemberModalOpen(true);
  };

  const handleSaveMemberSubmit = async (e) => {
    e.preventDefault();
    if (!memberName.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: memberId,
          name: memberName
        })
      });

      const data = await response.json();
      if (response.ok) {
        showToast(memberId ? 'Miembro actualizado' : 'Miembro creado correctamente');
        setIsMemberModalOpen(false);
        fetchData();
      } else {
        showToast(data.error || 'Error al guardar miembro', 'danger');
      }
    } catch (error) {
      console.error(error);
      showToast('Error de conexión', 'danger');
    }
  };

  const handleDeleteMember = async (id, name) => {
    setConfirmConfig({
      message: `¿Estás seguro de eliminar a ${name}? Esto cambiará las divisiones de todos los meses.`,
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_BASE}/members/${id}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            showToast('Miembro eliminado.');
            fetchData();
          } else {
            showToast('Error al eliminar miembro', 'danger');
          }
        } catch (error) {
          console.error(error);
          showToast('Error al eliminar miembro', 'danger');
        }
      }
    });
  };

  // Service CRUD Management
  const handleOpenServiceModal = (existing = null) => {
    if (existing) {
      setServiceId(existing.id);
      setServiceName(existing.name);
      setServiceSuministro(existing.suministro);
      setServiceTitular(existing.titular);
    } else {
      setServiceId(null);
      setServiceName('');
      setServiceSuministro('');
      setServiceTitular('');
    }
    setIsServiceModalOpen(true);
  };

  const handleSaveServiceSubmit = async (e) => {
    e.preventDefault();
    if (!serviceName.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: serviceId,
          name: serviceName,
          suministro: serviceSuministro,
          titular: serviceTitular
        })
      });

      const data = await response.json();
      if (response.ok) {
        showToast(serviceId ? 'Servicio actualizado' : 'Servicio creado correctamente');
        setIsServiceModalOpen(false);
        fetchData();
      } else {
        showToast(data.error || 'Error al guardar el servicio', 'danger');
      }
    } catch (error) {
      console.error(error);
      showToast('Error de conexión', 'danger');
    }
  };

  const handleDeleteService = async (id, name) => {
    setConfirmConfig({
      message: `¿Estás seguro de eliminar el servicio "${name}"? Se borrarán todos sus montos históricos.`,
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_BASE}/services/${id}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            showToast('Servicio eliminado.');
            fetchData();
          } else {
            showToast('Error al eliminar servicio', 'danger');
          }
        } catch (error) {
          console.error(error);
          showToast('Error al eliminar servicio', 'danger');
        }
      }
    });
  };

  // Rules Config Management
  const handleRuleCheckboxChange = (serviceId, memberId, checked) => {
    setTempRules(prev => {
      const updated = { ...prev };
      if (!updated[serviceId]) updated[serviceId] = [];
      
      if (checked) {
        if (!updated[serviceId].includes(memberId)) {
          updated[serviceId].push(memberId);
        }
      } else {
        updated[serviceId] = updated[serviceId].filter(id => id !== memberId);
      }
      return updated;
    });
  };

  const handleSaveRules = async () => {
    try {
      const formattedRules = Object.keys(tempRules).map(id => ({
        service_id: parseInt(id),
        member_ids: tempRules[id]
      }));

      const response = await fetch(`${API_BASE}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: formattedRules })
      });

      if (response.ok) {
        showToast('Reglas de división actualizadas correctamente!');
        fetchData();
      } else {
        showToast('Error al actualizar las reglas', 'danger');
      }
    } catch (error) {
      console.error(error);
      showToast('Error de conexión', 'danger');
    }
  };

  // WhatsApp Share Message builder
  const handleShareWhatsApp = () => {
    const monthName = MONTH_NAMES[selectedMonth - 1];
    
    let text = `🏠 *${monthName} ${selectedYear}* 🏠\n\n`;
    
    services.forEach(s => {
      const item = currentExpense.items.find(i => i.service_id === s.id);
      if (item && item.amount > 0) {
        text += `• *${s.name}:* S/ ${item.amount.toFixed(2)}`;
        if (item.due_date) {
          text += ` _(Vence: ${item.due_date})_`;
        }
        text += `\n`;
      }
    });

    text += `---------------------------------\n`;
    text += `💰 *TOTAL DEL MES:* S/ ${totalExpense.toFixed(2)}\n\n`;
    
    text += `👤 *A pagar:*\n`;
    
    memberBreakdown.forEach(m => {
      if (m.total > 0) {
        text += `• *${m.name}:* S/ ${m.total.toFixed(2)}\n`;
        const serviceNames = m.details.map(d => d.split(':')[0].trim());
        text += `   _(${serviceNames.join(' + ')})_\n`;
      }
    });

    text += `\n_Gastos Servicios del Hogar_ 📱`;
    
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Chart Setup
  const getChartData = () => {
    const chronExpenses = [...expenses].reverse().slice(-12); // Get last 12 months
    const labels = chronExpenses.map(e => `${MONTH_NAMES[e.month - 1].slice(0, 3)} ${e.year.toString().slice(-2)}`);
    
    const datasets = services.map((service, index) => {
      let color = '#a78bfa'; // default violet
      const nameLower = service.name.toLowerCase();
      if (nameLower.includes('luz')) color = '#fbbf24';
      else if (nameLower.includes('agua')) color = '#0ea5e9';
      else if (nameLower.includes('gas')) color = '#f97316';
      else {
        const colors = ['#10b981', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e'];
        color = colors[index % colors.length];
      }

      return {
        label: service.name,
        data: chronExpenses.map(e => {
          const item = e.items.find(i => i.service_id === service.id);
          return item ? item.amount : 0;
        }),
        backgroundColor: color,
        borderRadius: 4,
      };
    });

    const lineData = {
      labels,
      datasets: [
        {
          label: 'Gasto Total',
          data: chronExpenses.map(e => e.items.reduce((sum, i) => sum + i.amount, 0)),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: true,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
        }
      ]
    };

    return { barData: { labels, datasets }, lineData };
  };

  const { barData, lineData } = (expenses.length > 0 && services.length > 0)
    ? getChartData() 
    : { barData: { labels: [], datasets: [] }, lineData: { labels: [], datasets: [] } };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { family: 'Outfit', size: 12 },
          padding: 12
        }
      },
      tooltip: {
        titleFont: { family: 'Outfit', weight: 'bold' },
        bodyFont: { family: 'Outfit' },
        callbacks: {
          label: function(context) {
            return ` ${context.dataset.label}: S/ ${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { family: 'Outfit' } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { 
          color: '#64748b', 
          font: { family: 'Outfit' },
          callback: function(value) { return 'S/ ' + value; },
          autoSkip: false
        }
      }
    }
  };

  return (
    <div className="app-container">
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: toast.type === 'danger' ? 'var(--danger)' : 'var(--success)',
          color: '#fff',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
          animation: 'modalSlideIn 0.2s ease-out'
        }}>
          {toast.type === 'danger' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span style={{ fontWeight: 500 }}>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="app-title-group">
          <h1>Servicios del Hogar</h1>
          <p>Control de recibos y división inteligente de gastos</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="tabs-header">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          Resumen Mensual
        </button>
        <button 
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <Wrench size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          Servicios (Suministros)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          Historial y Gráficos
        </button>
        <button 
          className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          <Settings size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          Miembros y Reglas
        </button>
      </div>

      {/* Main Content Sections */}
      {activeTab === 'dashboard' && (
        <div className="dashboard-grid">
          {/* Left Main column (2fr) */}
          <div>
            {/* Month Slider */}
            <div className="month-selector">
              <button className="month-nav-btn" onClick={handlePrevMonth}>
                <ChevronLeft size={24} />
              </button>
              <div className="month-name">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </div>
              <button className="month-nav-btn" onClick={handleNextMonth}>
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Total Highlight Card */}
            <div className="glass-card gasto-total-card" style={{ marginBottom: '1.25rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <Coins size={60} style={{ color: 'rgba(59, 130, 246, 0.1)' }} />
              </div>
              
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  GASTO TOTAL DEL MES
                </div>
                <div className="total-amount-display">
                  S/ {totalExpense.toFixed(2)}
                  {totalExpense > 0 && (
                      <button 
                        className="btn btn-whatsapp" 
                        onClick={handleShareWhatsApp}
                        title="Compartir por WhatsApp"
                        style={{
                          boxShadow: '0 4px 10px rgba(37, 211, 102, 0.2)',
                          cursor: 'pointer'
                        }}
                      >
                        <Share2 size={14} />
                      </button>
                  )}
              </div>
            </div>
          </div>

            {/* Dynamic Services Cards Summary */}
            <div className="services-summary">
              {services.map(s => {
                const matchItem = currentExpense.items.find(i => i.service_id === s.id);
                const amount = matchItem ? matchItem.amount : 0;
                
                let colorClass = 'generic';
                const nameLower = s.name.toLowerCase();
                if (nameLower.includes('luz')) colorClass = 'luz';
                else if (nameLower.includes('agua')) colorClass = 'agua';
                else if (nameLower.includes('gas')) colorClass = 'gas';

                return (
                  <div key={s.id} className={`service-mini-card ${colorClass}`}>
                    <span className="label" style={{ fontWeight: 600 }}>
                      {nameLower.includes('luz') && '💡 '}
                      {nameLower.includes('agua') && '💧 '}
                      {nameLower.includes('gas') && '🔥 '}
                      {s.name}
                    </span>
                    <span className="val">S/ {amount.toFixed(2)}</span>
                    {matchItem && matchItem.due_date && (
                      <span className="due-badge">
                        Vence: {formatDueDate(matchItem.due_date)}
                      </span>
                    )}
                  </div>
                );
              })}
              {services.length === 0 && (
                <div style={{ gridColumn: 'span 3', textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                  No hay servicios configurados.
                </div>
              )}
            </div>

            {/* Breakdown Title */}
            <h3 className="section-title-compact">
              Resumen de Cuentas por Persona
            </h3>
            
            {/* Breakdown Cards */}
            <div className="calculation-list">
              {memberBreakdown.map(member => {
                let cls = '';
                if (member.name.toLowerCase() === 'rafo') cls = 'rafo';
                else if (member.name.toLowerCase() === 'mamá' || member.name.toLowerCase() === 'mama') cls = 'mama';
                else if (member.name.toLowerCase() === 'arnold') cls = 'arnold';
                
                return (
                  <div key={member.name} className={`member-calc-card ${cls}`}>
                    <div className="member-avatar">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-info">
                      <h4>{member.name}</h4>
                      <p style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                        {member.details.length > 0 ? (
                          member.details.map((d, i) => (
                            <span key={i} className="breakdown-badge">
                              {d}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Sin pagos asignados</span>
                        )}
                      </p>
                    </div>
                    <div className="member-amount">
                      S/ {member.total.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Right Sidebar column (1fr) */}
          <div>
            <div className="glass-card" style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} style={{ color: 'var(--primary)' }} />
                N° de Suministros
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {services.map(s => {
                  const matchItem = currentExpense.items.find(i => i.service_id === s.id);
                  
                  return (
                    <div key={s.id} className="supply-item">
                      <div className="supply-item-title">
                        <span>
                          {s.name.toLowerCase().includes('luz') && '💡 '}
                          {s.name.toLowerCase().includes('agua') && '💧 '}
                          {s.name.toLowerCase().includes('gas') && '🔥 '}
                          {s.name}
                        </span>
                      </div>
                      
                      <div className="supply-item-detail">
                        {s.suministro && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Coins size={12} style={{ color: 'var(--text-muted)' }} />
                            <b>Suministro:</b> {s.suministro}
                          </span>
                        )}
                        {s.titular && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <User size={12} style={{ color: 'var(--text-muted)' }} />
                            <b>Titular:</b> {s.titular}
                          </span>
                        )}

                      </div>
                    </div>
                  );
                })}
                {services.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem 0' }}>
                    Agrega servicios en la pestaña <b>Servicios</b> para ver sus suministros aquí.
                  </div>
                )}
              </div>
            </div>

            {/* Explanation Note moved here */}
            <div className="calculation-note">
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Nota de división actual:
              </h4>
              <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li>Cada recibo se divide equitativamente entre los miembros asignados.</li>
                <li>Puedes cambiar quién participa en cada servicio en la pestaña <b>Miembros y Reglas</b>.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Services Management Tab */}
      {activeTab === 'services' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card">
            <div className="section-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Catálogo de Servicios</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Administra los servicios activos en el hogar (Luz, Agua, Gas, Internet, etc.) y su información básica.
                </p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => handleOpenServiceModal()}>
                <Plus size={14} /> Registrar Servicio
              </button>
            </div>

            <div className="desktop-only-table table-container">
              <table className="expense-table">
                <thead>
                  <tr>
                    <th>Servicio</th>
                    <th>N° Suministro</th>
                    <th>Titular</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>
                          {s.name.toLowerCase().includes('luz') && '💡'}
                          {s.name.toLowerCase().includes('agua') && '💧'}
                          {s.name.toLowerCase().includes('gas') && '🔥'}
                        </span>
                        {s.name}
                      </td>
                      <td>{s.suministro || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                      <td>{s.titular || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                      <td className="table-actions-cell">
                        <div className="table-actions-wrapper">
                          <button 
                            className="btn btn-outline btn-sm" 
                            onClick={() => handleOpenServiceModal(s)}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteService(s.id, s.name)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {services.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No hay servicios cargados. Haz clic en "Registrar Servicio" para agregar uno.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mobile-services-list">
              {services.map(s => {
                const nameLower = s.name.toLowerCase();
                let emoji = '⚙️';
                if (nameLower.includes('luz')) emoji = '💡';
                else if (nameLower.includes('agua')) emoji = '💧';
                else if (nameLower.includes('gas')) emoji = '🔥';
                else if (nameLower.includes('internet') || nameLower.includes('wifi')) emoji = '🌐';
                else if (nameLower.includes('tv') || nameLower.includes('cable')) emoji = '📺';
                else if (nameLower.includes('fono') || nameLower.includes('telefono') || nameLower.includes('celular') || nameLower.includes('móvil') || nameLower.includes('movil')) emoji = '📞';
                else if (nameLower.includes('mantenimiento') || nameLower.includes('limpieza')) emoji = '🧹';

                return (
                  <div key={s.id} className="mobile-service-card">
                    <div className="mobile-service-card-header">
                      <span className="mobile-service-card-name">
                        {emoji} {s.name}
                      </span>
                      <div className="mobile-service-card-actions">
                        <button 
                          className="btn btn-outline btn-sm" 
                          onClick={() => handleOpenServiceModal(s)}
                          title="Editar"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteService(s.id, s.name)}
                          title="Eliminar"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mobile-service-card-body">
                      <div className="mobile-service-info-row">
                        <span className="info-label">N° Suministro:</span>
                        <span className="info-value">{s.suministro || <span style={{ color: 'var(--text-muted)' }}>-</span>}</span>
                      </div>
                      <div className="mobile-service-info-row">
                        <span className="info-label">Titular:</span>
                        <span className="info-value">{s.titular || <span style={{ color: 'var(--text-muted)' }}>-</span>}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {services.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No hay servicios cargados. Haz clic en "Registrar Servicio" para agregar uno.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Charts Container */}
          {expenses.length > 0 && services.length > 0 ? (
            <div className="config-section">
              <div className="glass-card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Servicios Detallados</h3>
                <div className="chart-container">
                  <Bar data={barData} options={chartOptions} plugins={[legendPaddingPlugin]} />
                </div>
              </div>
              <div className="glass-card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Tendencia del Gasto Total</h3>
                <div className="chart-container">
                  <Line data={lineData} options={chartOptions} plugins={[legendPaddingPlugin]} />
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ textAlignment: 'center', padding: '3rem' }}>
              Cargando gráficos o faltan datos de servicios...
            </div>
          )}

          {/* History Records Table (Dynamic Columns) */}
          <div className="glass-card">
            <div className="section-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Todos los Registros</h3>
            </div>
            
            <div className="desktop-only-table table-container">
              <table className="expense-table">
                <thead>
                  <tr>
                    <th>Mes / Año</th>
                    {services.map(s => (
                      <th key={s.id}>{s.name}</th>
                    ))}
                    <th>💰 Total</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => {
                    const rowTotal = exp.items.reduce((sum, i) => sum + i.amount, 0);
                    return (
                      <tr key={`${exp.year}-${exp.month}`}>
                        <td style={{ fontWeight: 600 }}>
                          {MONTH_NAMES[exp.month - 1]} {exp.year}
                        </td>
                        {services.map(s => {
                          const item = exp.items.find(i => i.service_id === s.id);
                          return (
                            <td key={s.id}>
                              {item ? `S/ ${item.amount.toFixed(2)}` : 'S/ 0.00'}
                            </td>
                          );
                        })}
                        <td style={{ fontWeight: 700, color: '#fff' }}>
                          S/ {rowTotal.toFixed(2)}
                        </td>
                        <td className="table-actions-cell">
                          <div className="table-actions-wrapper">
                            <button 
                              className="btn btn-outline btn-sm" 
                              onClick={() => {
                                setSelectedYear(exp.year);
                                setSelectedMonth(exp.month);
                                handleOpenAddModal(exp);
                              }}
                            >
                              Editar
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteExpense(exp.id, exp.year, exp.month)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={services.length + 3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No hay registros guardados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mobile-records-list">
              {expenses.map(exp => {
                const rowTotal = exp.items.reduce((sum, i) => sum + i.amount, 0);
                return (
                  <div key={`${exp.year}-${exp.month}`} className="mobile-record-card">
                    <div className="mobile-record-header">
                      <span className="mobile-record-date">
                        {MONTH_NAMES[exp.month - 1]} {exp.year}
                      </span>
                      <span className="mobile-record-total">
                        S/ {rowTotal.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="mobile-record-services">
                      {services.map(s => {
                        const item = exp.items.find(i => i.service_id === s.id);
                        const amount = item ? item.amount : 0;
                        const nameLower = s.name.toLowerCase();
                        let emoji = '⚙️';
                        if (nameLower.includes('luz')) emoji = '💡';
                        else if (nameLower.includes('agua')) emoji = '💧';
                        else if (nameLower.includes('gas')) emoji = '🔥';
                        else if (nameLower.includes('internet') || nameLower.includes('wifi')) emoji = '🌐';
                        else if (nameLower.includes('tv') || nameLower.includes('cable')) emoji = '📺';
                        else if (nameLower.includes('fono') || nameLower.includes('telefono') || nameLower.includes('celular') || nameLower.includes('móvil') || nameLower.includes('movil')) emoji = '📞';
                        else if (nameLower.includes('mantenimiento') || nameLower.includes('limpieza')) emoji = '🧹';
                        
                        return (
                          <div key={s.id} className="mobile-record-service-item">
                            <span className="service-name-mini">{emoji} {s.name}</span>
                            <span className="service-amount-mini">S/ {amount.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mobile-record-actions">
                      <button 
                        className="btn btn-outline btn-sm" 
                        onClick={() => {
                          setSelectedYear(exp.year);
                          setSelectedMonth(exp.month);
                          handleOpenAddModal(exp);
                        }}
                      >
                        Editar
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteExpense(exp.id, exp.year, exp.month)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
              {expenses.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No hay registros guardados
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="config-section">
          {/* Members config */}
          <div className="glass-card">
            <div className="section-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Miembros del Hogar</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Agrega o quita integrantes del hogar. Los cálculos se actualizarán en tiempo real.
                </p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => handleOpenMemberModal()}>
                <UserPlus size={14} /> Registrar Miembro
              </button>
            </div>

            <div className="members-grid" style={{ marginTop: '1.5rem' }}>
              {members.map(m => {
                const initial = m.name.charAt(0).toUpperCase();
                return (
                  <div key={m.id} className="member-individual-card">
                    <div className="member-card-content">
                      <div className="member-avatar">
                        {initial}
                      </div>
                      <span className="member-name">{m.name}</span>
                    </div>
                    <div className="member-card-actions">
                      <button 
                        className="btn btn-outline btn-sm" 
                        onClick={() => handleOpenMemberModal(m)}
                        title="Editar"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteMember(m.id, m.name)}
                        title="Eliminar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {members.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', width: '100%' }}>
                  No hay miembros registrados. Haz clic en "Registrar Miembro" para agregar uno.
                </div>
              )}
            </div>
          </div>

          {/* Division Rules Config (Dynamic Services) */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
              Reglas de División
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Selecciona quién participa en el pago de cada servicio. El costo total se dividirá equitativamente entre los miembros seleccionados.
            </p>

            <div>
              {services.map(service => (
                <div key={service.id} className="service-config-row">
                  <div className="service-config-title">
                    {service.name.toLowerCase().includes('luz') && '💡 '}
                    {service.name.toLowerCase().includes('agua') && '💧 '}
                    {service.name.toLowerCase().includes('gas') && '🔥 '}
                    {service.name}
                  </div>
                  <div className="service-config-checkboxes">
                    {members.map(m => {
                      const isChecked = (tempRules[service.id] || []).includes(m.id);
                      return (
                        <label key={m.id} className="checkbox-label">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={(e) => handleRuleCheckboxChange(service.id, m.id, e.target.checked)}
                          />
                          <span className="custom-checkbox"></span>
                          {m.name}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button 
                className="btn btn-primary" 
                style={{ marginTop: '1rem' }}
                onClick={handleSaveRules}
              >
                Guardar Reglas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button className="fab" onClick={() => handleOpenAddModal()} title="Registrar nuevo recibo">
        <Plus size={24} />
      </button>

      {/* Expense Input Modal (Dynamic Form Fields) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>Registrar Gastos Mensuales</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <ChevronRight size={24} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            
            <form onSubmit={handleSaveExpenseSubmit}>
              <div className="modal-body">
                <div className="modal-grid-2col">
                  <div className="form-group">
                    <label>Año</label>
                    <CustomSelect 
                      value={modalYear}
                      onChange={setModalYear}
                      options={[
                        { value: 2025, label: "2025" },
                        { value: 2026, label: "2026" },
                        { value: 2027, label: "2027" }
                      ]}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mes</label>
                    <CustomSelect 
                      value={modalMonth}
                      onChange={setModalMonth}
                      options={MONTH_NAMES.map((name, idx) => ({ value: idx + 1, label: name }))}
                    />
                  </div>
                </div>

                <div className="modal-section-divider">
                  <h4>Detalle por Servicio:</h4>
                  
                  {services.map(s => {
                    const val = modalItems[s.id] || { amount: '', due_date: '' };
                    return (
                      <div key={s.id} className="modal-service-card">
                        <div style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {s.name.toLowerCase().includes('luz') && '💡'}
                          {s.name.toLowerCase().includes('agua') && '💧'}
                          {s.name.toLowerCase().includes('gas') && '🔥'}
                          {s.name}
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Monto</label>
                            <div className="input-wrapper">
                              <span className="input-prefix">S/</span>
                              <input 
                                type="number" 
                                step="0.01" 
                                className="form-control has-prefix" 
                                placeholder="0.00"
                                value={val.amount}
                                onChange={e => handleModalItemChange(s.id, 'amount', e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Vencimiento</label>
                            <CustomDatePicker 
                              value={val.due_date}
                              onChange={formattedDate => handleModalItemChange(s.id, 'due_date', formattedDate)}
                              contextYear={modalYear}
                              contextMonth={modalMonth}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {services.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem 0' }}>
                      Crea servicios en la pestaña <b>Servicios</b> para poder ingresar sus recibos.
                    </div>
                  )}
                </div>

                <div className="modal-footer-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={services.length === 0}>
                    Guardar Gastos
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service CRUD Modal */}
      {isServiceModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{serviceId ? 'Editar Servicio' : 'Registrar Servicio'}</h3>
              <button className="modal-close-btn" onClick={() => setIsServiceModalOpen(false)}>
                <ChevronRight size={24} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            
            <form onSubmit={handleSaveServiceSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre del Servicio</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ej: Internet, Luz, Cable"
                    value={serviceName}
                    onChange={e => setServiceName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Número de Suministro</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ej: 1624103"
                    value={serviceSuministro}
                    onChange={e => setServiceSuministro(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Titular del Recibo</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ej: Mamá, Arnold"
                    value={serviceTitular}
                    onChange={e => setServiceTitular(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setIsServiceModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Guardar Servicio
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member CRUD Modal */}
      {isMemberModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>{memberId ? 'Editar Integrante' : 'Registrar Integrante'}</h3>
              <button className="modal-close-btn" onClick={() => setIsMemberModalOpen(false)}>
                <ChevronRight size={24} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            
            <form onSubmit={handleSaveMemberSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre del Integrante</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ej: Arnold, Mamá, Rafo"
                    value={memberName}
                    onChange={e => setMemberName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setIsMemberModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Guardar Integrante
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {confirmConfig && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '400px', animation: 'modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Confirmación</h3>
            </div>
            <div className="modal-body" style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                {confirmConfig.message}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  className="btn btn-outline btn-sm" 
                  onClick={() => setConfirmConfig(null)}
                  style={{ width: 'auto', padding: '0.5rem 1.25rem' }}
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  className="btn btn-danger btn-sm" 
                  onClick={() => {
                    confirmConfig.onConfirm();
                    setConfirmConfig(null);
                  }}
                  style={{ width: 'auto', padding: '0.5rem 1.25rem' }}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
