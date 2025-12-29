import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../../api/axiosInstance';

interface ChatMessage {
  type: 'ENTER' | 'TALK' | 'LEAVE';
  chatRoomId: number;
  senderId: number;
  senderNickname: string;
  message: string;
  sentAt: string; // ISO 8601 string
  chatMessageId?: number; // 서버에서 생성되는 메시지 ID
}

// 백엔드의 ChatHistoryResponse와 동일한 구조
interface ChatHistoryResponse {
  chatRoomId: number;
  messages: ChatMessage[];
}

interface ChatRoomProps {
  productId: number;
  currentUserId: number;
  currentUserNickname: string;
  currentProductTitle: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ productId, currentUserId, currentUserNickname, currentProductTitle }) => {
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 채팅방 ID 상태 (백엔드에서 가져오거나 생성)
  const [chatRoomId, setChatRoomId] = useState<number | null>(null);

  const API_BASE_URL = 'http://localhost:8080';
  const WS_URL = 'http://localhost:8080/ws';

  // 스크롤을 항상 최하단으로 유지
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // 1. 채팅 기록 불러오기 및 채팅방 ID 가져오기
    const fetchChatHistoryAndConnect = async () => {
      try {
        const historyResponse = await api.get<ChatHistoryResponse>(`/api/chat/history/${productId}`);
        setMessages(historyResponse.data.messages);
        setChatRoomId(historyResponse.data.chatRoomId);

      } catch (error) {
        console.error('채팅 기록 불러오기 실패:', error);
      }
    };

    fetchChatHistoryAndConnect();
  }, [productId, API_BASE_URL]);

  useEffect(() => {
    if (chatRoomId === null) return; // chatRoomId가 설정되지 않으면 연결 시도 안함

    // STOMP 클라이언트 초기화 및 연결
      const client = new Client({
      webSocketFactory: () => new (SockJS as any)(WS_URL),
      debug: () => {
        // debug log removed
      },
      reconnectDelay: 5000, // 5초마다 재접속 시도
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: () => {
        // connection established
        setStompClient(client);

        // 특정 채팅방 토픽 구독
        client.subscribe(`/topic/chat/room/${chatRoomId}`, (message) => {
          setMessages((prevMessages) => {
            const receivedMessage: ChatMessage = JSON.parse(message.body);

            // ID 타입을 문자열로 변환하여 비교
            if (String(receivedMessage.senderId) === String(currentUserId) && receivedMessage.chatMessageId) {
              const newMessages = [...prevMessages];

              // 내가 보낸 임시 메시지(서버 ID가 없음)
              const optimisticMessageIndex = newMessages.findIndex(
                m => !m.chatMessageId && String(m.senderId) === String(currentUserId)
              );

              // 찾았다면, 임시 메시지를 서버로부터 받은 메시지로 교체
              if (optimisticMessageIndex > -1) {
                newMessages[optimisticMessageIndex] = receivedMessage;
                return newMessages;
              }
            }

            // 다른 사람이 보낸 메시지이거나, 교체할 임시 메시지를 찾지 못한 경우,
            // 그리고 목록에 없는 새로운 메시지일 경우에만 추가한다.
            if (!prevMessages.some(m => m.chatMessageId && m.chatMessageId === receivedMessage.chatMessageId)) {
                return [...prevMessages, receivedMessage];
            }

            // 그 외의 경우는 상태를 변경하지 않는다 (중복 방지).
            return prevMessages;
          });
        });

        // 입장 메시지 전송
        client.publish({
          destination: '/app/chat/message',
          body: JSON.stringify({
            type: 'ENTER',
            chatRoomId: chatRoomId,
            senderId: currentUserId,
            senderNickname: currentUserNickname,
            message: '',
          } as ChatMessage),
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error:', frame.headers['message']);
        console.error('Additional details:', frame.body);
      },
      onDisconnect: () => {
        // disconnected
      }
    });

    client.activate(); // 클라이언트 활성화 (연결 시도)

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      if (client.connected) {
         // 퇴장 메시지 전송 (선택 사항)
         client.publish({
            destination: '/app/chat/message',
            body: JSON.stringify({
                type: 'LEAVE',
                chatRoomId: chatRoomId,
                senderId: currentUserId,
                senderNickname: currentUserNickname,
                message: '',
            } as ChatMessage),
         });
        client.deactivate();
        // WebSocket connection deactivated
      }
    };
  }, [chatRoomId, WS_URL, currentUserId, currentUserNickname]); // chatRoomId가 변경될 때마다 연결 다시 시도

  // 메시지 전송 핸들러
  const handleSendMessage = () => {
    if (stompClient && stompClient.connected && newMessage.trim() !== '' && chatRoomId !== null) {
      const chatMessage: ChatMessage = {
        type: 'TALK',
        chatRoomId: chatRoomId,
        senderId: currentUserId,
        senderNickname: currentUserNickname,
        message: newMessage.trim(),
        sentAt: new Date().toISOString(), // ISO 8601 형식
      };
      stompClient.publish({
        destination: '/app/chat/message',
        body: JSON.stringify(chatMessage),
      });
      setNewMessage('');
    }
  };

  // 메시지 입력 변경 핸들러
  const handleChangeMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  // 엔터 키로 메시지 전송
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // 기본 Enter 동작 방지 (줄바꿈 등)
      handleSendMessage();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // 메시지가 업데이트될 때마다 스크롤

  return (
    <div className="chat-room-container">
      <div className="chat-room-header">
        <h5>{productId}. {currentProductTitle} 채팅방</h5>
      </div>

      <div className="chat-room-messages">
        {messages.map((msg) => (
          <div 
            key={msg.chatMessageId || msg.sentAt}
            className={`chat-message ${String(msg.senderId) === String(currentUserId) ? 'sent' : 'received'} ${msg.type !== 'TALK' ? 'system' : ''}`}
          >
            {msg.type !== 'TALK' ? (
              <div className="chat-system-message">{msg.message}</div>
            ) : (
              <div className={`chat-bubble ${String(msg.senderId) === String(currentUserId) ? 'sent' : 'received'}`}>
                <span className="chat-bubble-nickname">{msg.senderNickname}</span>
                <div>{msg.message}</div>
                <div className="chat-bubble-time">
                  {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-room-footer">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
          <div className="chat-input-group">
            <div className="chat-input">
              <input
                type="text"
                className="form-control"
                value={newMessage}
                onChange={handleChangeMessage}
                onKeyDown={handleKeyDown}
                placeholder="메시지 입력..."
                disabled={stompClient === null || !stompClient.connected || chatRoomId === null}
              />
            </div>
            <button
              type="submit"
              className="chat-send-btn"
              disabled={stompClient === null || !stompClient.connected || chatRoomId === null}
            >
              전송
            </button>
          </div>
        </form>
        {!stompClient?.connected && <div className="chat-connection-status">서버와 연결 중...</div>}
      </div>
    </div>
  );
};

export default ChatRoom;
