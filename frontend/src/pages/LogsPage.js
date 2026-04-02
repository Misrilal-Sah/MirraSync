import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import useUIStore from '../stores/uiStore';
import Sidebar from '../components/layout/Sidebar';
import { Button, Spinner, Search, ChevronLeft, ChevronRight, Badge, Dropdown } from '../components/ui';
import api from '../lib/api';

const FilterIcon = ({ size=16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const SortIcon = ({ size=14, direction }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    {direction === 'asc' ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
  </svg>
);

export default function LogsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { sidebarOpen } = useUIStore();
  
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination State
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Sorting State
  const [sortCol, setSortCol] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    if (!user?.isAdmin) {
      toast.error('Unauthorized access');
      navigate('/settings');
      return;
    }
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, levelFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const res = await api.get('/logs', { params: { limit, offset, level: levelFilter || undefined } });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  // Client-side search & sort within current page chunk
  const processedLogs = useMemo(() => {
    let result = [...logs];
    
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l => 
        l.source?.toLowerCase().includes(q) || 
        l.message?.toLowerCase().includes(q)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      let valA = a[sortCol];
      let valB = b[sortCol];
      
      if (sortCol === 'createdAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }
      
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [logs, search, sortCol, sortDir]);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return 'red';
      case 'warn': return 'yellow';
      case 'info': return 'teal';
      default: return 'gray';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
  };
  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)' }}>
      {sidebarOpen && <Sidebar />}
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '24px 32px 16px', flexShrink: 0, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
                System Logs
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Real-time monitoring and historical log analysis
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} icon={<ChevronLeft size={16} />}>
                Back to Settings
              </Button>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Search size={14} />
              </span>
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search messages or sources..." 
                style={{ 
                  width: '100%', padding: '9px 12px 9px 36px', 
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', 
                  fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none',
                  transition: 'border-color 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }} 
                onFocus={e => e.target.style.borderColor = 'var(--accent-teal)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
              />
            </div>
            
            <Dropdown 
              align="right"
              trigger={
                <Button variant="secondary" size="md" icon={<FilterIcon size={14} />}>
                  {levelFilter ? `Level: ${levelFilter.toUpperCase()}` : 'All Levels'}
                </Button>
              }
              items={[
                { label: 'All Levels', onClick: () => { setLevelFilter(''); setPage(1); } },
                { divider: true },
                { label: 'Error', onClick: () => { setLevelFilter('error'); setPage(1); } },
                { label: 'Warning', onClick: () => { setLevelFilter('warn'); setPage(1); } },
                { label: 'Info', onClick: () => { setLevelFilter('info'); setPage(1); } }
              ]}
            />
          </div>
        </div>

        {/* Table Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 32px' }}>
          <div style={{ minWidth: 800, padding: '16px 0' }}>
            {/* Table Header */}
            <div style={{ 
              display: 'grid', gridTemplateColumns: '140px 100px 140px 1fr', gap: 16, 
              padding: '12px 16px', 
              background: 'var(--bg-elevated)', 
              borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
              border: '1px solid var(--border-subtle)',
              borderBottom: 'none',
              fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              <div 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none' }}
                onClick={() => toggleSort('createdAt')}
              >
                Date & Time {sortCol === 'createdAt' && <SortIcon direction={sortDir} />}
              </div>
              <div 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none' }}
                onClick={() => toggleSort('level')}
              >
                Level {sortCol === 'level' && <SortIcon direction={sortDir} />}
              </div>
              <div 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none' }}
                onClick={() => toggleSort('source')}
              >
                Source {sortCol === 'source' && <SortIcon direction={sortDir} />}
              </div>
              <div>Message</div>
            </div>

            {/* Table Body */}
            <div style={{ 
              border: '1px solid var(--border-subtle)', 
              borderRadius: '0 0 var(--radius-md) var(--radius-md)',
              background: 'var(--bg-overlay)',
              minHeight: 400
            }}>
              {loading ? (
                <div style={{ display: 'flex', height: 400, alignItems: 'center', justifyContent: 'center' }}>
                  <Spinner size={32} />
                </div>
              ) : processedLogs.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: 400, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <FilterIcon size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                  <p>No logs found matching your criteria</p>
                </div>
              ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="show">
                  <AnimatePresence>
                    {processedLogs.map((log, index) => (
                      <motion.div 
                        key={log.id || index}
                        variants={rowVariants}
                        layout
                        style={{ 
                          display: 'grid', gridTemplateColumns: '140px 100px 140px 1fr', gap: 16, 
                          padding: '14px 16px',
                          borderBottom: index === processedLogs.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                          fontSize: 13,
                          alignItems: 'center',
                          color: 'var(--text-primary)',
                          fontFamily: 'JetBrains Mono, monospace', // Mono for logs looks better!
                          transition: 'background 0.2s',
                          cursor: 'default'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            month: 'short', day: '2-digit', 
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </div>
                        <div>
                          <Badge variant={getLevelColor(log.level)} size="sm">
                            {log.level.toUpperCase()}
                          </Badge>
                        </div>
                        <div style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>
                          {log.source || 'system'}
                        </div>
                        <div style={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          color: log.level === 'error' ? 'var(--danger)' : 'var(--text-primary)'
                        }}>
                          {log.message}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination Footer */}
        <div style={{ 
          padding: '16px 32px', 
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-elevated)',
          flexShrink: 0
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Showing {logs.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} results
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button 
              variant="secondary" size="icon" 
              disabled={page === 1 || loading} 
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 8px' }}>
              Page {page} of {totalPages}
            </span>
            <Button 
              variant="secondary" size="icon" 
              disabled={page >= totalPages || loading} 
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
