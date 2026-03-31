import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import useChatStore from '../../stores/chatStore';
import useUIStore from '../../stores/uiStore';
import { LOGO_URL } from '../../lib/modelRegistry';
import {
  MessageSquare, History, Settings2, LogOut, Plus,
  Pencil, Trash, Pin, ChevronLeft, User
} from '../ui';

export default function Sidebar() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user, logout } = useAuthStore();
  const { conversations, loadConversations, deleteConversation, renameConversation, togglePinConversation, clearCurrentChat } = useChatStore();
  const { sidebarOpen, openSettings, toggleSidebar } = useUIStore();
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  const handleNewChat = () => {
    clearCurrentChat();
    navigate('/chat');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Signed out successfully');
  };

  const startEdit = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveEdit = async (id) => {
    if (editTitle.trim()) await renameConversation(id, editTitle.trim());
    setEditingId(null);
  };

  // Group conversations
  const now = new Date();
  const groups = {
    Pinned: conversations.filter(c => c.pinned),
    Today: conversations.filter(c => !c.pinned && isToday(new Date(c.updatedAt), now)),
    Yesterday: conversations.filter(c => !c.pinned && isYesterday(new Date(c.updatedAt), now)),
    'Last 7 Days': conversations.filter(c => !c.pinned && isLast7Days(new Date(c.updatedAt), now)),
    Older: conversations.filter(c => !c.pinned && isOlder(new Date(c.updatedAt), now)),
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'MS';

  return (
    <div style={{
      width: sidebarOpen ? 'var(--sidebar-width)' : '0px',
      minWidth: sidebarOpen ? 'var(--sidebar-width)' : '0px',
      height: '100vh',
      background: 'var(--bg-surface)',
      borderRight: sidebarOpen ? '1px solid var(--border-subtle)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), border 0.3s ease',
    }}>
      <div style={{
        opacity: sidebarOpen ? 1 : 0,
        transition: 'opacity 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: 'var(--sidebar-width)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={LOGO_URL} alt="MirraSync" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
              <span style={{
                fontSize: 18, fontWeight: 800,
                background: 'var(--accent-gradient)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>MirraSync</span>
            </Link>
            <button
              onClick={toggleSidebar}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 'var(--radius-sm)', display: 'flex', transition: 'color 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* New Chat */}
          <button
            onClick={handleNewChat}
            style={{
              width: '100%', padding: '8px 12px',
              background: 'var(--accent-gradient)', border: 'none',
              borderRadius: 'var(--radius-md)', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Space Grotesk, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: 'var(--shadow-glow-teal)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Plus size={14} />
            New Chat
          </button>
        </div>

        {/* Nav items */}
        <div style={{ padding: '8px 8px 4px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <NavItem icon={<History size={15} />} label="History" onClick={() => navigate('/history')} />
        </div>

        {/* Conversations */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
          {!user ? (
            <div style={{ padding: '20px 8px', textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
                Sign in to save your chat history
              </p>
              <button
                onClick={() => navigate('/login')}
                style={{ fontSize: 12, color: 'var(--accent-teal)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Sign in →
              </button>
            </div>
          ) : (
            Object.entries(groups).map(([label, convs]) => {
              if (convs.length === 0) return null;
              return (
                <div key={label} style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '4px 8px', marginBottom: 2 }}>
                    {label}
                  </p>
                  {convs.map(conv => (
                    <ConvItem
                      key={conv.id}
                      conv={conv}
                      isActive={conv.id === conversationId}
                      isEditing={editingId === conv.id}
                      editTitle={editTitle}
                      onEditTitleChange={setEditTitle}
                      onStartEdit={startEdit}
                      onSaveEdit={saveEdit}
                      onDelete={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                      onPin={(e) => { e.stopPropagation(); togglePinConversation(conv.id); }}
                      onClick={() => navigate(`/chat/${conv.id}`)}
                    />
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* User footer */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '10px 8px', flexShrink: 0 }}>
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', marginBottom: 4 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: user.avatarUrl ? 'transparent' : 'var(--accent-gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden',
                }}>
                  {user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                </div>
              </div>
              <NavItem icon={<Settings2 size={15} />} label="Settings" onClick={() => openSettings()} />
              <NavItem icon={<LogOut size={15} />} label="Sign out" onClick={handleLogout} danger />
            </>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => navigate('/login')} style={{ flex: 1, padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>Sign in</button>
              <button onClick={() => navigate('/signup')} style={{ flex: 1, padding: '8px', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>Sign up</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 10px', background: 'none', border: 'none',
        borderRadius: 'var(--radius-sm)', cursor: 'pointer',
        color: danger ? 'var(--danger)' : 'var(--text-secondary)',
        fontSize: 13, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 500,
        transition: 'all var(--transition-fast)', textAlign: 'left',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = danger ? 'var(--danger)' : 'var(--text-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = danger ? 'var(--danger)' : 'var(--text-secondary)'; }}
    >
      {icon}
      {label}
    </button>
  );
}

function ConvItem({ conv, isActive, isEditing, editTitle, onEditTitleChange, onStartEdit, onSaveEdit, onDelete, onPin, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 8px', borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        background: isActive ? 'var(--accent-teal-dim)' : hovered ? 'var(--bg-hover)' : 'transparent',
        borderLeft: isActive ? '2px solid var(--accent-teal)' : '2px solid transparent',
        transition: 'all var(--transition-fast)',
        marginBottom: 1,
      }}
    >
      <MessageSquare size={13} style={{ color: isActive ? 'var(--accent-teal)' : 'var(--text-muted)', flexShrink: 0 }} />

      {isEditing ? (
        <input
          value={editTitle}
          onChange={e => onEditTitleChange(e.target.value)}
          onBlur={() => onSaveEdit(conv.id)}
          onKeyDown={e => { if (e.key === 'Enter') onSaveEdit(conv.id); if (e.key === 'Escape') onSaveEdit(null); }}
          autoFocus
          onClick={e => e.stopPropagation()}
          style={{
            flex: 1, background: 'var(--bg-overlay)', border: '1px solid var(--accent-teal)',
            borderRadius: 'var(--radius-xs)', padding: '2px 6px',
            fontSize: 12, color: 'var(--text-primary)', fontFamily: 'Space Grotesk, sans-serif', outline: 'none',
          }}
        />
      ) : (
        <span style={{
          flex: 1, fontSize: 12, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: 1.4,
        }}>
          {conv.pinned ? '📌 ' : ''}{conv.title}
        </span>
      )}

      {hovered && !isEditing && (
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <IconBtn onClick={e => onStartEdit(conv, e)} title="Rename"><Pencil size={12} /></IconBtn>
          <IconBtn onClick={onPin} title={conv.pinned ? 'Unpin' : 'Pin'}><Pin size={12} /></IconBtn>
          <IconBtn onClick={onDelete} title="Delete" danger><Trash size={12} /></IconBtn>
        </div>
      )}
    </motion.div>
  );
}

function IconBtn({ children, onClick, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 3,
        borderRadius: 'var(--radius-xs)',
        color: danger ? 'var(--danger)' : 'var(--text-muted)',
        display: 'flex', alignItems: 'center',
      }}
    >
      {children}
    </button>
  );
}

// Date helpers
const isToday = (d, now) => d.toDateString() === now.toDateString();
const isYesterday = (d, now) => { const y = new Date(now); y.setDate(y.getDate() - 1); return d.toDateString() === y.toDateString(); };
const isLast7Days = (d, now) => { const week = new Date(now); week.setDate(week.getDate() - 7); return d > week && !isToday(d, now) && !isYesterday(d, now); };
const isOlder = (d, now) => { const week = new Date(now); week.setDate(week.getDate() - 7); return d <= week; };
