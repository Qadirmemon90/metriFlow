import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { formatPaisa, formatDateTime, formatDate, rupeesToPaisa } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  Phone,
  Clock,
  User,
  Plus,
  RefreshCw,
} from 'lucide-react';

export const WhatsAppInboxPage: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [converting, setConverting] = useState(false);

  // Fetch threads
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/whatsapp/conversations');
      const list = Array.isArray(res) ? res : res.items || [];
      setConversations(list);

      if (!selectedConversation && list.length > 0) {
        setSelectedConversation(list[0]);
      }
    } catch (err) {
      console.error('Failed to load WhatsApp conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages & drafts for selected thread
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchThreadDetails = async () => {
      try {
        const [msgsRes, draftsRes]: any = await Promise.all([
          api.get(`/whatsapp/conversations/${selectedConversation.customerPhone}/messages`),
          api.get('/sales/drafts', { customerPhone: selectedConversation.customerPhone }),
        ]);

        const msgs = Array.isArray(msgsRes) ? msgsRes : msgsRes.items || [];
        const drfts = Array.isArray(draftsRes) ? draftsRes : draftsRes.items || [];

        setMessages(msgs);
        setDrafts(drfts);

        // Auto-select latest draft if available
        if (drfts.length > 0) {
          setSelectedDraft(drfts[0]);
        } else {
          setSelectedDraft(null);
        }
      } catch (err) {
        console.error('Failed to load thread details:', err);
      }
    };

    fetchThreadDetails();
  }, [selectedConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConversation) return;

    setSending(true);
    try {
      await api.post('/whatsapp/messages/outbound', {
        toPhone: selectedConversation.customerPhone,
        messageType: 'text',
        textBody: replyText,
      });

      setReplyText('');
      // Refresh messages
      const msgsRes: any = await api.get(`/whatsapp/conversations/${selectedConversation.customerPhone}/messages`);
      setMessages(Array.isArray(msgsRes) ? msgsRes : msgsRes.items || []);
    } catch (err: any) {
      alert(err.message || 'Failed to send WhatsApp message');
    } finally {
      setSending(false);
    }
  };

  // Convert AI Draft into Confirmed / Draft Order (Human-in-the-Loop review)
  const handleConvertDraft = async () => {
    if (!selectedDraft) return;

    setConverting(true);
    try {
      const orderPayload = {
        customerId: selectedDraft.customerId?._id || selectedDraft.customerId || selectedDraft.customerId?.id,
        notes: `Converted from WhatsApp Draft (Msg Ref: ${selectedDraft.sourceMessageId || 'WA'})`,
        items: selectedDraft.items.map((i: any) => ({
          productId: i.productId?._id || i.productId || i.productId?.id,
          quantity: i.quantity,
          unitPricePaisa: i.unitPricePaisa,
        })),
      };

      const createdOrder: any = await api.post('/sales/orders', orderPayload);
      alert(`Order #${createdOrder.orderNumber || createdOrder.id} successfully created from WhatsApp AI draft!`);
      navigate(`/app/orders/${createdOrder.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to convert AI draft into wholesale order');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top Bar */}
      <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          <h1 className="text-base font-black text-slate-900 tracking-tight">WhatsApp Live Inbox & AI Drafts</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={fetchConversations}
        >
          Refresh
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Pane 1: Conversations List */}
        <div className="w-72 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Conversations ({conversations.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading chats...</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No WhatsApp conversations yet. Messages sent to your connected Cloud API number will appear here.
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id || c.customerPhone}
                  onClick={() => setSelectedConversation(c)}
                  className={`w-full text-left p-3 transition flex items-start gap-2.5 ${
                    selectedConversation?.customerPhone === c.customerPhone
                      ? 'bg-white border-l-4 border-emerald-600 shadow-sm'
                      : 'hover:bg-slate-100/70'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
                    {c.customerName ? c.customerName[0].toUpperCase() : 'W'}
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate">
                        {c.customerName || 'Wholesale Buyer'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDate(c.lastMessageAt || c.updatedAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{c.customerPhone}</p>
                    <p className="text-slate-600 truncate mt-1 text-[11px]">{c.lastMessageText || 'Voice / Media Order'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Pane 2: Live Message Stream */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConversation ? (
            <>
              {/* Active Contact Header */}
              <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white px-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedConversation.customerName || 'Wholesale Buyer'}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{selectedConversation.customerPhone}</span>
                  </span>
                </div>
                <Badge variant="success" size="sm">24h Session Active</Badge>
              </div>

              {/* Message Bubbles */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    No messages recorded in this conversation yet.
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isInbound = m.direction === 'INBOUND';
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-md rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                            isInbound
                              ? 'bg-white border border-slate-200 text-slate-900 rounded-tl-sm'
                              : 'bg-emerald-700 text-white rounded-tr-sm'
                          }`}
                        >
                          <p>{m.textBody || m.content || '[Audio Note / Media]'}</p>
                          <span
                            className={`block text-[10px] mt-1 text-right font-mono ${
                              isInbound ? 'text-slate-400' : 'text-emerald-200'
                            }`}
                          >
                            {formatDateTime(m.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a WhatsApp message to buyer..."
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={sending}
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Select a conversation to view chat history.
            </div>
          )}
        </div>

        {/* Pane 3: AI Draft Order Review (Human in the loop) */}
        <div className="w-80 border-l border-slate-200 bg-slate-50/80 p-4 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                AI Extracted Order Draft
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-4 leading-normal">
              Gemini extracted these items from the buyer's WhatsApp message. Review and verify before confirming.
            </p>

            {selectedDraft ? (
              <div className="space-y-4">
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Extraction Confidence</span>
                    <Badge variant={selectedDraft.confidenceScore >= 0.8 ? 'success' : 'warning'} size="sm">
                      {Math.round((selectedDraft.confidenceScore || 0.85) * 100)}% Match
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-600 italic border-l-2 border-emerald-500 pl-2">
                    "{selectedDraft.rawText || 'Customer order message'}"
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Detected Items ({selectedDraft.items?.length || 0})
                  </span>
                  {selectedDraft.items?.map((item: any, idx: number) => (
                    <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{item.productSku || item.rawInputText}</span>
                        <span className="font-mono text-emerald-800">{formatPaisa(item.unitPricePaisa)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Quantity: {item.quantity}</span>
                        <span className="font-mono font-bold text-slate-800">
                          {formatPaisa(item.quantity * item.unitPricePaisa)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Draft Total:</span>
                    <span className="font-mono text-slate-900 font-black">
                      {formatPaisa(
                        selectedDraft.items?.reduce(
                          (s: number, i: any) => s + (i.quantity * i.unitPricePaisa || 0),
                          0
                        ) || 0
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                No active AI order draft for this customer.
              </div>
            )}
          </div>

          {selectedDraft && (
            <div className="pt-4 border-t border-slate-200">
              <Button
                variant="primary"
                size="sm"
                className="w-full font-bold shadow-md"
                isLoading={converting}
                onClick={handleConvertDraft}
                icon={<ShoppingCart className="w-4 h-4" />}
              >
                Confirm into Wholesale Order
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
