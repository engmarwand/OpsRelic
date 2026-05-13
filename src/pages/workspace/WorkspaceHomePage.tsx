import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../lib/store';
import { 
  Users, FolderOpen, Briefcase, Plus, Shield, User, Crown, 
  Activity, Send, CheckCircle2, Circle, Clock, MessageSquare, 
  Trash2, UserPlus, Filter, MoreVertical, Search, Zap, Sparkles 
} from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { 
  collection, addDoc, doc, setDoc, onSnapshot, query, orderBy, 
  limit, deleteDoc, updateDoc, serverTimestamp 
} from 'firebase/firestore';
import { useToast } from '../../lib/toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

// --- SUB-COMPONENTS ---

const TeamChat = ({ workspaceId }: { workspaceId: string }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!workspaceId) return;
    const q = query(
      collection(db, 'workspaces', workspaceId, 'discussion'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: any[] = [];
      snapshot.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }, (err) => {
      console.error("Chat listener error:", err);
      addToast("Real-time feed disconnected. Check your connection.", "error");
    });

    return () => unsubscribe();
  }, [workspaceId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !workspaceId || isSending) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, 'workspaces', workspaceId, 'discussion'), {
        workspaceId,
        authorId: auth.currentUser?.uid,
        authorName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Unknown',
        content: newMessage.trim(),
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (err: any) {
      addToast('Failed to send message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-[var(--color-divider)] bg-[var(--color-surface2)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[var(--color-cyan)]" />
          <h3 className="font-bold text-[var(--color-text-main)]">Agency Feed</h3>
        </div>
        <div className="text-[10px] uppercase tracking-widest font-black text-faint bg-white/5 px-2 py-1 rounded-full">
          Real-time
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
            <MessageSquare className="w-12 h-12 mb-4" />
            <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.authorId === auth.currentUser?.uid;
            return (
              <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  {!isMe && <span className="text-[10px] font-black uppercase tracking-tighter text-faint">{msg.authorName}</span>}
                  <span className="text-[9px] text-faint">
                    {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className={cn(
                  "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                  isMe 
                    ? "bg-gradient-to-br from-[var(--color-cyan)] to-[#0099ff] text-white rounded-tr-none" 
                    : "bg-[var(--color-surface2)] text-[var(--color-text-main)] border border-[var(--color-border-subtle)] rounded-tl-none"
                )}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--color-divider)] bg-[var(--color-surface2)] flex items-center gap-2">
        <input 
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2 text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] transition-all"
        />
        <button 
          type="submit"
          disabled={!newMessage.trim() || isSending}
          className="w-10 h-10 rounded-xl bg-[var(--color-cyan)] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-all shrink-0 shadow-lg"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

const TaskBoard = ({ workspaceId, tasks, setTasks }: { workspaceId: string, tasks: any[], setTasks: React.Dispatch<React.SetStateAction<any[]>> }) => {
  const { clients, campaignsList, workspaceMembers } = useAppContext();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [groupBy, setGroupBy] = useState<'status' | 'client' | 'dueDate'>('status');
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const { addToast } = useToast();

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !workspaceId || isAdding) return;

    setIsAdding(true);
    try {
      const assignee = workspaceMembers?.find(m => m.userId === newTaskAssigneeId);
      await addDoc(collection(db, 'workspaces', workspaceId, 'tasks'), {
        workspaceId,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || null,
        status: newTaskStatus,
        priority: 'medium',
        clientId: selectedClientId || null,
        campaignId: selectedCampaignId || null,
        dueDate: newTaskDueDate || null,
        assigneeId: newTaskAssigneeId || null,
        assigneeName: assignee?.fullName || assignee?.email?.split('@')[0] || null,
        creatorId: auth.currentUser?.uid,
        creatorName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskStatus('todo');
      setNewTaskAssigneeId('');
      setNewTaskDueDate('');
      setSelectedClientId('');
      setSelectedCampaignId('');
      setShowAddForm(false);
      addToast('Task created', 'success');
    } catch (err: any) {
      addToast('Failed to add task', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'workspaces', workspaceId, 'tasks', taskId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      addToast('Failed to update status', 'error');
    }
  };

  const toggleTask = async (task: any) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    updateTaskStatus(task.id, newStatus);
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'workspaces', workspaceId, 'tasks', taskId));
    } catch (err: any) {
      addToast('Failed to delete task', 'error');
    }
  };

  const getClientName = (id: string) => clients?.find(c => c.id === id)?.name || 'Generic';
  const getCampaignName = (id: string) => campaignsList?.find(c => c.id === id)?.name || '';

  const renderGroupedTasks = () => {
    if (groupBy === 'status') {
      const todo = tasks.filter(t => t.status === 'todo');
      const inProgress = tasks.filter(t => t.status === 'in_progress');
      const done = tasks.filter(t => t.status === 'done');
      
      return (
        <div className="space-y-10">
          {[
            { label: 'To Do', items: todo, color: 'bg-gray-400' },
            { label: 'In Progress', items: inProgress, color: 'bg-[var(--color-cyan)] shadow-[0_0_8px_rgba(0,185,255,0.5)]' },
            { label: 'Done', items: done, color: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' }
          ].map(group => group.items.length > 0 && (
            <div key={group.label} className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", group.color)}></div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-main)]">{group.label} ({group.items.length})</h4>
              </div>
              <div className="space-y-3">
                {group.items.map(task => <TaskItem key={task.id} task={task} />)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (groupBy === 'dueDate') {
      const today = new Date().toISOString().split('T')[0];
      const overdue: any[] = [];
      const upcoming: any[] = [];
      const noDate: any[] = [];

      tasks.forEach(t => {
        if (!t.dueDate) noDate.push(t);
        else if (t.dueDate < today && t.status !== 'done') overdue.push(t);
        else upcoming.push(t);
      });

      return (
        <div className="space-y-8">
          {overdue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                <h4 className="text-xs font-black uppercase tracking-widest text-red-500">Overdue</h4>
              </div>
              {overdue.map(task => <TaskItem key={task.id} task={task} />)}
            </div>
          )}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)] shadow-[0_0_8px_rgba(0,185,255,0.5)]"></div>
                <h4 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-main)]">Upcoming</h4>
              </div>
              {upcoming.map(task => <TaskItem key={task.id} task={task} />)}
            </div>
          )}
          {noDate.length > 0 && (
             <div className="space-y-3">
               <div className="flex items-center gap-2 px-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                 <h4 className="text-xs font-black uppercase tracking-widest text-faint">No Due Date</h4>
               </div>
               {noDate.map(task => <TaskItem key={task.id} task={task} />)}
             </div>
          )}
        </div>
      );
    }

    if (groupBy === 'client') {
      const clientGroups: Record<string, any[]> = {};
      tasks.forEach(t => {
        const cId = t.clientId || 'unassigned';
        if (!clientGroups[cId]) clientGroups[cId] = [];
        clientGroups[cId].push(t);
      });

      return (
        <div className="space-y-8">
          {Object.entries(clientGroups).map(([cId, groupTasks]) => (
            <div key={cId} className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)] shadow-[0_0_8px_rgba(0,185,255,0.5)]"></div>
                <h4 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-main)]">
                  {cId === 'unassigned' ? 'Internal / General' : getClientName(cId)}
                </h4>
              </div>
              {groupTasks.map(task => <TaskItem key={task.id} task={task} />)}
            </div>
          ))}
        </div>
      );
    }
    
    return <div className="text-center py-10 text-faint text-xs">No tasks found</div>;
  };

  const TaskItem = ({ task }: { task: any }) => (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex flex-col p-4 bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-2xl hover:border-[var(--color-cyan)]/30 transition-all shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <button 
            onClick={() => toggleTask(task)}
            className="w-6 h-6 mt-0.5 rounded-full border-2 border-[var(--color-border-subtle)] flex-shrink-0 flex items-center justify-center hover:border-[var(--color-cyan)] transition-colors"
          >
            {task.status === 'done' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <Circle className="w-3 h-3 text-transparent group-hover:text-[var(--color-cyan)]/30" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className={cn("text-base font-bold text-[var(--color-text-main)] leading-tight", task.status === 'done' && "line-through opacity-50")}>
              {task.title}
            </div>
            {task.description && (
              <p className="text-xs text-faint mt-1.5 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {task.clientId && (
                <span className="text-[9px] bg-[var(--color-cyan)]/10 text-[var(--color-cyan)] px-2 py-0.5 rounded-md font-black uppercase border border-[var(--color-cyan)]/20">
                  {getClientName(task.clientId)}
                </span>
              )}
              {task.campaignId && (
                <span className="text-[9px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-md font-black uppercase border border-purple-500/20">
                  {getCampaignName(task.campaignId)}
                </span>
              )}
              
              <div className="flex items-center gap-1.5 text-[10px] text-faint font-bold bg-white/5 px-2 py-0.5 rounded-md">
                <User className="w-3 h-3" />
                <span>{task.assigneeName || 'Unassigned'}</span>
              </div>

              {task.dueDate && (
                <div className={cn(
                  "flex items-center gap-1.5 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border",
                  new Date(task.dueDate) < new Date() && task.status !== 'done' 
                    ? "bg-red-500/10 text-red-500 border-red-500/20" 
                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                )}>
                  <Clock className="w-3 h-3" />
                  <span>{new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <select 
            value={task.status}
            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
            className="text-[9px] font-black uppercase bg-black/20 border border-white/10 rounded-lg px-2 py-1 outline-none text-faint hover:text-white transition-colors"
          >
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <button 
            onClick={() => deleteTask(task.id)}
            className="p-2 text-red-500/30 hover:text-red-500 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-[700px] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-5 border-b border-[var(--color-divider)] bg-[var(--color-surface2)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-cyan)]/10 flex items-center justify-center text-[var(--color-cyan)] border border-[var(--color-cyan)]/20 shadow-inner">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--color-text-main)] text-lg">Agency Tasks</h3>
            <p className="text-[10px] text-faint font-medium uppercase tracking-[0.2em]">{todoCount(tasks)} Pending Deliverables</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as any)}
            className="text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none text-faint hover:text-white transition-colors"
          >
            <option value="status">By Status</option>
            <option value="client">By Client</option>
            <option value="dueDate">By Due Date</option>
          </select>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95",
              showAddForm ? "bg-red-500/20 text-red-500 border border-red-500/30" : "bg-[var(--color-cyan)] text-white"
            )}
          >
            {showAddForm ? <Plus className="w-5 h-5 rotate-45" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        <AnimatePresence>
          {showAddForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={addTask} className="bg-[var(--color-surface2)] border border-[var(--color-cyan)]/20 p-6 rounded-3xl space-y-4 shadow-xl">
                <input 
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                  placeholder="Task title..."
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl px-5 py-4 text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] transition-all"
                />
                <textarea 
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Description (optional)..."
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl px-5 py-3 text-xs text-faint outline-none focus:border-[var(--color-cyan)] transition-all resize-none h-20"
                />
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-faint uppercase px-2">Client Link</label>
                    <select 
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl px-3 py-2 text-[10px] font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] transition-colors"
                    >
                      <option value="">No Client</option>
                      {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-faint uppercase px-2">Campaign</label>
                    <select 
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                      className="w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl px-3 py-2 text-[10px] font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] transition-colors"
                    >
                      <option value="">No Campaign</option>
                      {campaignsList?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-faint uppercase px-2">Assign To</label>
                    <select 
                      value={newTaskAssigneeId}
                      onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                      className="w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl px-3 py-2 text-[10px] font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] transition-colors"
                    >
                      <option value="">Unassigned</option>
                      {(workspaceMembers || []).map(m => (
                        <option key={m.id} value={m.userId || ''}>{m.fullName || m.email}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-faint uppercase px-2">Status</label>
                    <select 
                      value={newTaskStatus}
                      onChange={(e) => setNewTaskStatus(e.target.value as any)}
                      className="w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl px-3 py-2 text-[10px] font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] transition-colors"
                    >
                      <option value="todo">Todo</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-faint uppercase px-2">Due Date</label>
                    <input 
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl px-3 py-2 text-[10px] font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] transition-colors"
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      type="submit"
                      disabled={isAdding || !newTaskTitle}
                      className="w-full bg-white text-black font-black uppercase text-[10px] py-2.5 rounded-xl hover:opacity-90 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Zap className="w-3 h-3 fill-black" /> Create Task
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pb-10">
          {tasks.length > 0 ? renderGroupedTasks() : (
            <div className="py-20 text-center opacity-30">
              <Zap className="w-16 h-16 mx-auto mb-6 text-[var(--color-cyan)]" />
              <p className="text-sm font-black uppercase tracking-[0.2em]">Efficiency 100%</p>
              <p className="text-[10px] font-bold mt-2 italic">Nothing on the radar...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const todoCount = (tasks: any[]) => tasks.filter(t => t.status !== 'done').length;

const CampaignsSnapshot = () => {
  const { campaignsList, clients } = useAppContext();
  
  const activeCampaigns = (campaignsList || [])
    .filter(c => c.status === 'Active')
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
    .slice(0, 5);

  const getClientName = (id: string) => clients?.find(c => c.id === id)?.name || 'Agency';

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-3xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-[var(--color-divider)] bg-[var(--color-surface2)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-purple-400" />
          <h3 className="font-bold text-[var(--color-text-main)] text-sm">Active Campaigns</h3>
        </div>
        <div className="text-[9px] font-black uppercase text-faint">{activeCampaigns.length} Live</div>
      </div>
      <div className="p-3 space-y-2">
        {activeCampaigns.length > 0 ? (
          activeCampaigns.map((camp) => (
            <a 
              key={camp.id} 
              href={`/campaigns/${camp.id}`}
              className="flex items-center justify-between p-3 rounded-2xl hover:bg-[var(--color-surface2)] transition-all border border-transparent hover:border-[var(--color-divider)]"
            >
              <div className="min-w-0">
                <div className="text-xs font-black text-[var(--color-text-main)] truncate">{camp.name}</div>
                <div className="text-[9px] font-bold text-faint uppercase mt-0.5">{getClientName(camp.clientId)}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Active</span>
              </div>
            </a>
          ))
        ) : (
          <div className="py-8 text-center text-faint text-xs italic">No active campaigns</div>
        )}
      </div>
    </div>
  );
};

const RecentAssets = ({ workspaceId }: { workspaceId: string }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    if (!workspaceId) return;
    const q = query(
      collection(db, 'workspaces', workspaceId, 'files'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fs: any[] = [];
      snapshot.forEach(doc => fs.push({ id: doc.id, ...doc.data() }));
      setFiles(fs);
    });

    return () => unsubscribe();
  }, [workspaceId]);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName || !newFileUrl || !workspaceId) return;

    try {
      await addDoc(collection(db, 'workspaces', workspaceId, 'files'), {
        workspaceId,
        name: newFileName,
        url: newFileUrl,
        type: 'Link',
        size: '-',
        creatorId: auth.currentUser?.uid,
        createdAt: serverTimestamp()
      });
      setNewFileName('');
      setNewFileUrl('');
      setShowAdd(false);
      addToast('Asset added to workspace', 'success');
    } catch (err) {
      addToast('Failed to add asset', 'error');
    }
  };

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-3xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-[var(--color-divider)] bg-[var(--color-surface2)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-[var(--color-text-main)] text-sm">Recent Files</h3>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}>
          <Plus className={cn("w-4 h-4 text-faint hover:text-white transition-all", showAdd && "rotate-45")} />
        </button>
      </div>

      <div className="p-3 space-y-2">
        {showAdd && (
          <form onSubmit={handleAddAsset} className="p-3 bg-[var(--color-surface2)] rounded-2xl border border-[var(--color-cyan)]/20 space-y-3 mb-2">
            <input 
              type="text" 
              placeholder="Asset Name (e.g. Logo V1)"
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--color-cyan)]"
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="URL / Link"
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--color-cyan)]"
              value={newFileUrl}
              onChange={e => setNewFileUrl(e.target.value)}
            />
            <button type="submit" className="w-full bg-[var(--color-cyan)] text-white font-black uppercase text-[10px] py-2 rounded-xl hover:opacity-90">
              Add Asset
            </button>
          </form>
        )}

        {files.length > 0 ? (
          files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[var(--color-surface2)] transition-all group">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-blue-400 border border-white/5">
                <FolderOpen className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <a 
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[var(--color-text-main)] truncate group-hover:text-[var(--color-cyan)] transition-colors block"
                >
                  {file.name}
                </a>
                <div className="text-[9px] font-medium text-faint uppercase mt-0.5">{file.type || 'Asset'} • {file.size || '0 KB'}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-faint text-xs italic">No brand assets yet</div>
        )}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function WorkspaceHomePage() {
  const { workspace, activeWorkspace, workspaceMembers, clients, campaignsList, activeWorkspaceId, userRole, currentTier } = useAppContext();
  const { addToast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'team' | 'assets'>('tasks');
  
  const workspaceName = (activeWorkspace as any)?.brand?.name || workspace?.brand?.name || 'Agency Hub';
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MANAGER' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [isInviting, setIsInviting] = useState(false);

  const workspaceId = activeWorkspaceId || auth.currentUser?.uid;

  useEffect(() => {
    if (!workspaceId) return;
    const q = query(
      collection(db, 'workspaces', workspaceId, 'tasks'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tsks: any[] = [];
      snapshot.forEach(doc => tsks.push({ id: doc.id, ...doc.data() }));
      setTasks(tsks);
    }, (err) => {
      console.error("Task board listener error:", err);
    });

    return () => unsubscribe();
  }, [workspaceId]);

  const isOwnerOrManager = userRole === 'agency' || (workspaceMembers?.find(m => m.userId === auth.currentUser?.uid)?.role === 'MANAGER') || (workspaceMembers?.find(m => m.userId === auth.currentUser?.uid)?.role === 'OWNER');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId || !inviteEmail) return;
    
    setIsInviting(true);
    try {
      const memberId = `member_${Date.now()}`;
      await setDoc(doc(db, 'workspaceMembers', memberId), {
        workspaceId: activeWorkspaceId,
        userId: null,
        email: inviteEmail,
        role: inviteRole,
        fullName: inviteEmail.split('@')[0],
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      
      setInviteEmail('');
      addToast('Invitation sent successfully', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to send invite', 'error');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberEmail} from the team?`)) return;
    
    try {
      await deleteDoc(doc(db, 'workspaceMembers', memberId));
      addToast('Member removed from workspace', 'success');
    } catch (err: any) {
      addToast('Failed to remove member', 'error');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'OWNER': return <Crown className="w-3.5 h-3.5 text-amber-500" />;
      case 'MANAGER': return <Shield className="w-3.5 h-3.5 text-blue-400" />;
      default: return <User className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  if (!workspaceId) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-[var(--color-cyan)]/20 border-t-[var(--color-cyan)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-[var(--color-divider)]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="px-2 py-0.5 rounded-lg bg-[var(--color-cyan)]/10 text-[var(--color-cyan)] text-[10px] font-black uppercase tracking-widest border border-[var(--color-cyan)]/20">
              {currentTier || 'Starter'}
            </div>
            {todoCount(tasks) > 0 && (
              <div className="px-2 py-0.5 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                {todoCount(tasks)} Items Pending
              </div>
            )}
          </div>
          <h1 className="font-display text-4xl font-black text-[var(--color-text-main)] tracking-tight mb-2">
            {workspaceName}
          </h1>
          <p className="text-[var(--color-text-subtle)] font-medium max-w-xl text-sm leading-relaxed">
            Status: {todoCount(tasks) === 0 ? 'Everything cleared' : 'Active agency cycle in progress'}. Review your priority alerts and team discussion below.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[var(--color-surface2)] p-4 rounded-3xl border border-[var(--color-divider)] shadow-xl">
           <div className="text-center px-4">
             <div className="text-2xl font-black text-[var(--color-text-main)]">{clients?.length || 0}</div>
             <div className="text-[9px] font-bold uppercase tracking-widest text-faint">Clients</div>
           </div>
           <div className="w-px h-8 bg-[var(--color-divider)]"></div>
           <div className="text-center px-4">
             <div className="text-2xl font-black text-[var(--color-text-main)]">{campaignsList?.length || 0}</div>
             <div className="text-[9px] font-bold uppercase tracking-widest text-faint">Campaigns</div>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-[var(--color-surface2)] p-2 rounded-2xl border border-[var(--color-border-subtle)] overflow-x-auto no-scrollbar shadow-sm">
        {[
          { id: 'tasks', label: 'Tasks & Deliverables', icon: CheckCircle2 },
          { id: 'team', label: 'Team & Discussion', icon: MessageSquare },
          { id: 'assets', label: 'Workspace Assets', icon: FolderOpen },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === t.id 
                ? 'bg-[var(--color-cyan)]/10 text-[var(--color-cyan)] shadow-sm border border-[var(--color-cyan)]/20' 
                : 'text-faint hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface)] border border-transparent'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT GRID */}
      <div>
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-8 space-y-8">
              <TaskBoard workspaceId={workspaceId} tasks={tasks} setTasks={setTasks} />
            </div>
            <div className="xl:col-span-4 space-y-8">
              <CampaignsSnapshot />
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-8 space-y-8">
              <TeamChat workspaceId={workspaceId} />
            </div>
            
            <div className="xl:col-span-4 space-y-8">
              {/* TEAM MEMBERS POP-OUT */}
              <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-3xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-[var(--color-divider)] flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[var(--color-text-main)] text-sm">Team Members</h3>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-[var(--color-surface2)] flex items-center justify-center text-[var(--color-text-subtle)]">
                    <Users className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-3 space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                  {(workspaceMembers || []).map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-[var(--color-surface2)] transition-all group/member">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs font-black text-white border border-white/5">
                        {member.fullName?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[var(--color-text-main)] truncate">{member.fullName || 'Invited'}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {getRoleIcon(member.role)}
                          <span className="text-[9px] font-semibold text-faint uppercase">{member.role}</span>
                        </div>
                      </div>
                      {isOwnerOrManager && member.userId !== auth.currentUser?.uid && (
                        <button 
                          onClick={() => handleRemoveMember(member.id, member.email || member.fullName)}
                          className="p-2 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover/member:opacity-100 transition-all"
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* INVITE BOX */}
              {isOwnerOrManager && (
                <div className="bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-3xl p-6 shadow-xl">
                    <div className="text-[10px] font-black uppercase tracking-widest text-faint mb-4 flex items-center gap-2">
                      <UserPlus className="w-3 h-3" /> Growth: Team Invite
                    </div>
                    <form onSubmit={handleInvite} className="space-y-4">
                      <input 
                        type="email" 
                        required
                        placeholder="Enter email address"
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl px-4 py-3 text-xs text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] shadow-inner transition-colors"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <select 
                          className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl px-3 py-3 text-xs text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] shadow-inner transition-colors"
                          value={inviteRole}
                          onChange={e => setInviteRole(e.target.value as any)}
                        >
                          <option value="MANAGER">Manager</option>
                          <option value="MEMBER">Member</option>
                          <option value="VIEWER">Viewer</option>
                        </select>
                        <button 
                          type="submit"
                          disabled={isInviting || !inviteEmail}
                          className="bg-white text-black hover:opacity-90 disabled:opacity-50 px-6 py-3 rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95"
                        >
                          Invite
                        </button>
                      </div>
                    </form>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-8 space-y-8">
              <RecentAssets workspaceId={workspaceId} />
            </div>
            <div className="xl:col-span-4 space-y-8">
               <CampaignsSnapshot />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
