import React from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../styles/ThemeContext';
import Input from '../common/Input';
import Button from '../common/Button';

export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isSystem?: boolean;
}

export interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.radius.md};
`;

const Header = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const Title = styled.h2`
  margin: 0;
  font-size: ${props => props.theme.typography.fontSize.lg};
  color: ${props => props.theme.colors.text.primary};
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const MessageItem = styled.div<{ isSystem?: boolean }>`
  padding: ${props => props.theme.spacing.sm};
  background: ${props => props.isSystem 
    ? `${props.theme.colors.primary}15`
    : props.theme.colors.background.primary};
  border-radius: ${props => props.theme.radius.md};
  border-left: 4px solid ${props => props.isSystem 
    ? props.theme.colors.primary 
    : props.theme.colors.secondary};
  box-shadow: ${props => props.theme.shadows.sm};
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    transform: translateX(2px);
  }
`;

const MessageSender = styled.div`
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.xs};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};

  &::before {
    content: '👤';
    font-size: ${props => props.theme.typography.fontSize.sm};
  }
`;

const MessageContent = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.md};
  line-height: ${props => props.theme.typography.lineHeight.relaxed};
`;

const InputArea = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.white};
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  box-shadow: ${props => props.theme.shadows.sm};
`;

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
}) => {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = React.useState('');

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Container>
      <Header>
        <Title>聊天室</Title>
      </Header>
      
      <MessageList>
        {messages.map((message) => (
          <MessageItem key={message.id} isSystem={message.isSystem}>
            <MessageSender>{message.sender}</MessageSender>
            <MessageContent>{message.content}</MessageContent>
          </MessageItem>
        ))}
      </MessageList>

      <InputArea>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入消息..."
          fullWidth
        />
        <Button onClick={handleSend} disabled={!inputValue.trim()}>
          发送
        </Button>
      </InputArea>
    </Container>
  );
};

export default ChatPanel; 