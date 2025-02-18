import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatTimestamp } from '../../utils/timestamp';
import type { Speech, BaseDebateSpeech } from '../../types/adapters';

interface SpeechRecordProps {
  speaker: string;
  content: string;
  timestamp: string;
  isCurrentSpeaker: boolean;
  onReference?: () => void;
  referencedSpeeches?: BaseDebateSpeech[];
  streaming?: boolean;
  type: 'speech' | 'innerThoughts' | 'system';
  avatar?: string;
  modelInfo?: string;
  characterName?: string;
}

const normalizeContent = (content: string, type: 'speech' | 'innerThoughts' | 'system') => {
  if (type === 'innerThoughts') {
    return content
      // // 保护 Markdown 语法
       .replace(/(\*\*.*?\*\*|__.*?__|`.*?`|#+ .*)/g, match => match.replace(/\n/g, '<BR>'))
      
      // // 处理数字序号后的换行，确保序号和内容在同一行
      // .replace(/(\d+\.)\s*\n+\s*([^\n])/g, '$1 $2')
      
      // // 处理所有包含空格或制表符的换行
       .replace(/[ \t]*\n[ \t]*/g, '\n')
      
      // // 将连续的换行符（3个以上）替换为2个换行符
      .replace(/\n{3,}/g, '\n\n')
      
      // // 处理每行内容，去除首尾空格，但保留行内的多个空格
      // .split('\n')
      // .map(line => {
      //   // 如果是序号开头的行，保持缩进
      //   if (/^\d+\./.test(line)) {
      //     return line.trimEnd();
      //   }
      //   return line.trim();
      // })
      // .filter(line => line.length > 0)  // 移除空行
      // .join('\n')
      
      // // 在特定标记后添加换行（如"分析："、"反驳方向："等）
      // .replace(/((?:分析|反驳方向|论证策略|下一步)：)/g, '\n$1\n')
      
      // // 恢复被保护的 Markdown 语法
       .replace(/<BR>/g, '\n')
      
      // // 去除首尾空白
      // .trim();
  }
  return content;
};

export const SpeechRecord: React.FC<SpeechRecordProps> = ({
  speaker,
  content,
  timestamp,
  isCurrentSpeaker,
  onReference,
  referencedSpeeches,
  streaming,
  type,
  avatar,
  modelInfo,
  characterName
}) => {
  const normalizedContent = normalizeContent(content, type);
  
  return (
    <Container $isCurrentSpeaker={isCurrentSpeaker} $type={type}>
      <TypeBadge $type={type}>
        <TypeInfo>
          {type === 'innerThoughts' ? (
            <>
              <TypeIcon>💭</TypeIcon>
              内心OS
            </>
          ) : type === 'system' ? (
            <>
              <TypeIcon>⚙️</TypeIcon>
              系统消息
            </>
          ) : (
            <>
              <TypeIcon>💬</TypeIcon>
              正式发言
            </>
          )}
          <Timestamp>{formatTimestamp(timestamp)}</Timestamp>
        </TypeInfo>
      </TypeBadge>
      <MessageContent>
        <Header>
          <PlayerInfo>
            <Avatar $url={avatar} />
            <NameContainer>
              <PlayerName>{speaker}</PlayerName>
              {characterName && <CharacterName>{characterName}</CharacterName>}
              {modelInfo && <ModelInfo>{modelInfo}</ModelInfo>}
              {streaming && (
                <StreamingBadge>
                  正在输入...
                </StreamingBadge>
              )}
            </NameContainer>
          </PlayerInfo>
        </Header>
        <Content $isStreaming={streaming} $type={type}>
          <div className={type === 'innerThoughts' ? 'inner-thoughts' : ''}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {normalizedContent}
            </ReactMarkdown>
          </div>
        </Content>
        {referencedSpeeches && referencedSpeeches.length > 0 && (
          <div style={{ 
            marginTop: '8px',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.02)',
            borderRadius: '4px',
            fontSize: '13px'
          }}>
            <div style={{ color: '#8c8c8c', marginBottom: '4px' }}>引用内容：</div>
            {referencedSpeeches.map((speech, index) => (
              <div key={speech.id} style={{ 
                padding: '4px 8px',
                color: '#666',
                borderLeft: '2px solid rgba(24, 144, 255, 0.3)'
              }}>
                {speech.content}
              </div>
            ))}
          </div>
        )}
      </MessageContent>
    </Container>
  );
};

// 样式组件定义
const Container = styled(motion.div)<{ 
  $isCurrentSpeaker: boolean;
  $type?: string;
}>`
  position: relative;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 8px 0;
  background: ${props => {
    switch (props.$type) {
      case 'innerThoughts':
        return '#f5f5f5';
      case 'system':
        return '#fff7e6';
      default:
        return '#f0f5ff';
    }
  }};
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    border-radius: 4px 0 0 4px;
    background: ${props => {
      switch (props.$type) {
        case 'innerThoughts':
          return 'linear-gradient(to bottom, #bfbfbf, #8c8c8c)';
        case 'system':
          return 'linear-gradient(to bottom, #ffa940, #fa8c16)';
        default:
          return 'linear-gradient(to bottom, #69c0ff, #1890ff)';
      }
    }};
  }
`;

const TypeBadge = styled.div<{ $type?: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.$type === 'innerThoughts' 
    ? 'linear-gradient(to right, rgba(0, 0, 0, 0.05), transparent)'
    : props.$type === 'system'
    ? 'linear-gradient(to right, rgba(250, 140, 22, 0.08), transparent)'
    : 'linear-gradient(to right, rgba(24, 144, 255, 0.08), transparent)'};
  font-size: 12px;
  color: ${props => props.$type === 'innerThoughts' 
    ? '#666' 
    : props.$type === 'system'
    ? '#fa8c16'
    : '#1890ff'};
  border-bottom: 1px solid ${props => props.$type === 'innerThoughts' 
    ? 'rgba(0, 0, 0, 0.05)'
    : props.$type === 'system'
    ? 'rgba(250, 140, 22, 0.1)'
    : 'rgba(24, 144, 255, 0.1)'};
`;

const TypeIcon = styled.span`
  font-size: 1.2em;
  margin-right: 8px;
  opacity: 0.8;
`;

const TypeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Timestamp = styled.span`
  font-size: 12px;
  color: #8c8c8c;
  margin-left: 8px;
`;

const MessageContent = styled.div`
  padding: 16px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

const Avatar = styled.div<{ $url?: string }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 12px;
  background: ${props => props.$url ? `url(${props.$url})` : '#e6f7ff'} center/cover;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  
  ${props => !props.$url && `
    &::after {
      content: '👤';
      font-size: 16px;
    }
  `}
`;

const NameContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const PlayerName = styled.span`
  font-weight: 500;
  color: #262626;
  font-size: 15px;
`;

const CharacterName = styled.span`
  color: #1890ff;
  font-size: 13px;
  font-weight: 500;
`;

const ModelInfo = styled.span`
  color: #8c8c8c;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 4px;
    background: #d9d9d9;
    border-radius: 50%;
  }
`;

const StreamingBadge = styled.span`
  font-size: 12px;
  padding: 2px 8px;
  background: rgba(24, 144, 255, 0.1);
  color: #1890ff;
  border-radius: 4px;
  margin-top: 4px;
`;

const Content = styled.div<{ $isStreaming?: boolean; $type?: string }>`
  white-space: pre-wrap;
  line-height: 1.5;
  color: #1f1f1f;
  
  ${props => props.$isStreaming && `
    &:after {
      content: '▋';
      display: inline-block;
      animation: blink 1s infinite;
      margin-left: 2px;
      color: #1890ff;
    }
  `}

  // Markdown 样式优化
  h1, h2, h3, h4, h5, h6 {
    margin: 0.3em 0 0.2em;
    line-height: 1.2;
    font-weight: 600;
  }

  // 针对内心OS的特殊样式
  .inner-thoughts {
    p {
      margin: 0.1em 0;  // 减小段落间距
      line-height: 1.4;  // 减小行高
    }
    
    p + p {
      margin-top: 0.3em;  // 减小相邻段落间距
    }
    
    br + br {
      display: none;  // 隐藏连续的换行
    }
  }

  h1 { font-size: 1.4em; }
  h2 { font-size: 1.3em; }
  h3 { font-size: 1.2em; }

  p {
    margin: 0.2em 0;
    line-height: 1.5;
  }

  p + p {
    margin-top: 0.5em;
  }

  strong {
    font-weight: 600;
    color: #000;
    margin: 0 0.1em;
  }

  em {
    font-style: italic;
    margin: 0 0.1em;
  }

  ul, ol {
    margin: 0.2em 0;
    padding-left: 1.2em;
  }

  li {
    margin: 0.1em 0;
    line-height: 2;
  }

  li + li {
    margin-top: 0.2em;
  }

  code {
    background: rgba(0, 0, 0, 0.05);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.9em;
    margin: 0 0.1em;
  }

  blockquote {
    border-left: 3px solid #ddd;
    margin: 0.3em 0;
    padding: 0.2em 0 0.2em 0.8em;
    color: #666;
  }

  // 减少元素之间的过大间距
  * + h1, * + h2, * + h3, * + h4, * + h5, * + h6 {
    margin-top: 0.2em;
  }

  h1 + p, h2 + p, h3 + p, h4 + p, h5 + p, h6 + p {
    margin-top: 0.3em;
  }

  ul + p, ol + p, p + ul, p + ol {
    margin-top: 0.3em;
  }
`; 