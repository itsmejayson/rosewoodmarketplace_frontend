import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Image, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { messageAPI } from '../../api';
import { getSocket } from '../../hooks/useSocket';
import useAuthStore from '../../store/authStore';
import { formatDate, getInitials } from '../../lib/utils';

export default function TransactionChat({ transactionId }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await messageAPI.getMessages(transactionId);
      setMessages(data.data);
    } catch {
      // silently fail — user may not have access yet
    } finally {
      setIsLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Join socket room and listen for new messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !transactionId) return;

    socket.emit('joinTransaction', transactionId);

    const handler = (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('newMessage', handler);
    return () => {
      socket.off('newMessage', handler);
      socket.emit('leaveTransaction', transactionId);
    };
  }, [transactionId]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;
    setIsSending(true);
    try {
      const { data } = await messageAPI.sendMessage(transactionId, content.trim(), imageFile);
      // Optimistically added via socket; fall back to direct add if socket not connected
      setMessages((prev) => prev.find((m) => m.id === data.data.id) ? prev : [...prev, data.data]);
      setContent('');
      setImageFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      // toast is handled by axios interceptor
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[400px] max-h-[520px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/40 flex-shrink-0">
        <MessageSquare className="h-4 w-4 text-rosewood-600" />
        <span className="text-sm font-medium">Transaction Chat</span>
        <span className="ml-auto text-xs text-muted-foreground">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-10">
            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold ${
                  isMine ? 'bg-rosewood-100 text-rosewood-700' : 'bg-muted text-muted-foreground'
                }`}>
                  {msg.sender?.profileImage
                    ? <img src={msg.sender.profileImage} alt="" className="h-7 w-7 rounded-full object-cover" />
                    : getInitials(msg.sender?.fullName)
                  }
                </div>

                {/* Bubble */}
                <div className={`max-w-[70%] flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-muted-foreground px-1">
                    {isMine ? 'You' : msg.sender?.fullName}
                    {' · '}
                    {msg.sender?.role === 'SELLER' && <span className="text-rosewood-500 font-medium">Seller</span>}
                    {msg.sender?.role === 'BUYER' && <span className="text-blue-500 font-medium">Buyer</span>}
                  </span>
                  <div className={`rounded-2xl px-3 py-2 text-sm break-words ${
                    isMine
                      ? 'bg-rosewood-600 text-white rounded-tr-sm'
                      : 'bg-muted text-foreground rounded-tl-sm'
                  }`}>
                    {msg.imageUrl && (
                      <a href={msg.imageUrl} target="_blank" rel="noreferrer">
                        <img src={msg.imageUrl} alt="attachment" className="max-w-[200px] rounded-lg mb-1 cursor-pointer" />
                      </a>
                    )}
                    {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1">
                    {new Date(msg.createdAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {imageFile && (
        <div className="px-4 pb-1 flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <img
              src={URL.createObjectURL(imageFile)}
              alt="preview"
              className="h-12 w-12 object-cover rounded border"
            />
            <button
              onClick={() => { setImageFile(null); if (fileRef.current) fileRef.current.value = ''; }}
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-white text-xs flex items-center justify-center"
            >×</button>
          </div>
          <span className="text-xs text-muted-foreground">{imageFile.name}</span>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t flex-shrink-0">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          title="Attach image"
        >
          <Image className="h-5 w-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setImageFile(e.target.files[0] || null)}
        />
        <Input
          className="flex-1 h-9"
          placeholder="Type a message…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          className="h-9 w-9 bg-rosewood-600 hover:bg-rosewood-700 flex-shrink-0"
          disabled={isSending || (!content.trim() && !imageFile)}
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
