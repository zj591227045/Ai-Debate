import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { message } from 'antd';
import type { BaseDebateSpeech, BaseDebateScore } from '../types/interfaces';

interface ExportOptions {
  title: string;
  description?: string;
  speeches: BaseDebateSpeech[];
  scores: BaseDebateScore[];
  dimensions: {
    name: string;
    weight: number;
    description: string;
    criteria: string[];
  }[];
}

export class ExportService {
  async exportToPDF(options: ExportOptions): Promise<void> {
    try {
      const { title, description, speeches, scores, dimensions } = options;
      
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4',
        putOnlyUsedFonts: true,
        floatPrecision: 16
      });

      // 添加中文字体支持
      const customFont = await fetch('/fonts/NotoSansSC-Regular.ttf').then(res => res.arrayBuffer());
      doc.addFileToVFS('NotoSansSC-Regular.ttf', Buffer.from(customFont).toString('base64'));
      doc.addFont('NotoSansSC-Regular.ttf', 'NotoSansSC', 'normal');
      doc.setFont('NotoSansSC');

      let yOffset = 40;
      const margin = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - 2 * margin;

      // 添加标题
      doc.setFontSize(24);
      doc.setTextColor(232, 240, 255); // #E8F0FF
      doc.text(title, pageWidth / 2, yOffset, { align: 'center' });
      yOffset += 40;

      // 添加描述
      if (description) {
        doc.setFontSize(12);
        doc.setTextColor(167, 187, 255, 0.7); // rgba(167,187,255,0.7)
        const descriptionLines = doc.splitTextToSize(description, contentWidth);
        doc.text(descriptionLines, margin, yOffset);
        yOffset += descriptionLines.length * 20 + 30;
      }

      // 添加评分维度
      doc.setFontSize(16);
      doc.setTextColor(232, 240, 255);
      doc.text('评分维度', margin, yOffset);
      yOffset += 25;

      doc.setFontSize(12);
      dimensions.forEach(dimension => {
        // 绘制维度背景
        doc.setFillColor(167, 187, 255, 0.05);
        doc.roundedRect(margin - 10, yOffset - 15, contentWidth + 20, 80, 8, 8, 'F');
        
        // 维度标题
        doc.setTextColor(232, 240, 255);
        const dimensionText = `${dimension.name}（权重：${dimension.weight}）`;
        doc.text(dimensionText, margin, yOffset);
        yOffset += 20;

        // 维度说明
        doc.setTextColor(167, 187, 255, 0.9);
        const descLines = doc.splitTextToSize(`说明：${dimension.description}`, contentWidth);
        doc.text(descLines, margin, yOffset);
        yOffset += descLines.length * 15;

        // 评分标准
        const criteriaText = `评分标准：${dimension.criteria.join('、')}`;
        const criteriaLines = doc.splitTextToSize(criteriaText, contentWidth);
        doc.text(criteriaLines, margin, yOffset);
        yOffset += criteriaLines.length * 15 + 25;

        if (yOffset > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          yOffset = margin;
        }
      });

      // 添加发言记录
      doc.addPage();
      yOffset = margin;
      doc.setFontSize(16);
      doc.setTextColor(232, 240, 255);
      doc.text('发言记录', margin, yOffset);
      yOffset += 25;

      doc.setFontSize(12);
      speeches.forEach((speech, index) => {
        // 绘制消息背景
        doc.setFillColor(167, 187, 255, 0.05);
        doc.roundedRect(margin - 10, yOffset - 15, contentWidth + 20, 120, 8, 8, 'F');

        // 轮次信息
        doc.setTextColor(167, 187, 255);
        const roundText = `第${speech.round}轮`;
        doc.text(roundText, margin, yOffset);
        yOffset += 20;

        // 发言人信息
        doc.setTextColor(232, 240, 255);
        const playerText = `发言人：${speech.playerId}`;
        doc.text(playerText, margin, yOffset);
        yOffset += 20;

        // 时间信息
        doc.setTextColor(167, 187, 255, 0.7);
        const timeText = `时间：${new Date(Number(speech.timestamp)).toLocaleString()}`;
        doc.text(timeText, margin, yOffset);
        yOffset += 20;

        // 发言内容
        doc.setTextColor(232, 240, 255);
        const contentLines = doc.splitTextToSize(speech.content, contentWidth - 20);
        doc.text(contentLines, margin + 10, yOffset);
        yOffset += contentLines.length * 15 + 20;

        // 添加评分信息
        const speechScore = scores.find(s => s.speechId === speech.id);
        if (speechScore) {
          // 评分背景
          doc.setFillColor(167, 187, 255, 0.1);
          doc.roundedRect(margin, yOffset - 10, contentWidth - 20, 100, 6, 6, 'F');

          doc.setTextColor(167, 187, 255);
          doc.text('评分详情：', margin + 10, yOffset);
          yOffset += 20;

          // 维度得分
          Object.entries(speechScore.dimensions).forEach(([dim, score]) => {
            doc.setTextColor(232, 240, 255, 0.9);
            doc.text(`${dim}：${score}分`, margin + 20, yOffset);
            yOffset += 15;
          });

          // 总分
          doc.setTextColor(65, 87, 255);
          doc.text(`总分：${speechScore.totalScore}分`, margin + 20, yOffset);
          yOffset += 20;

          // 评语
          if (speechScore.comment) {
            doc.setTextColor(167, 187, 255, 0.8);
            const commentLines = doc.splitTextToSize(`评语：${speechScore.comment}`, contentWidth - 40);
            doc.text(commentLines, margin + 20, yOffset);
            yOffset += commentLines.length * 15;
          }
        }

        // 添加分隔
        yOffset += 30;

        // 检查是否需要新页
        if (yOffset > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          yOffset = margin;
        }
      });

      // 保存文件
      const filename = `辩论记录_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      message.success('PDF导出成功！');
    } catch (error) {
      console.error('PDF导出失败:', error);
      message.error('PDF导出失败，请重试');
    }
  }

  async exportToImage(container: HTMLElement): Promise<void> {
    try {
      // 保存原始状态
      const originalStyle = {
        height: container.style.height,
        overflow: container.style.overflow,
        position: container.style.position,
        width: container.style.width,
        scrollTop: container.scrollTop,
        transform: container.style.transform
      };

      // 计算实际内容高度
      const scrollHeight = container.scrollHeight;
      
      // 临时修改容器样式以捕获完整内容
      Object.assign(container.style, {
        height: `${scrollHeight}px`,
        overflow: 'visible',
        position: 'relative',
        width: '100%',
        transform: 'translateY(0)'
      });

      // 创建一个临时容器来包装内容
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        background: ${window.getComputedStyle(container).background};
      `;
      
      // 克隆内容到临时容器
      const clone = container.cloneNode(true) as HTMLElement;
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      // 创建canvas
      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: null,
        height: scrollHeight,
        windowHeight: scrollHeight,
        onclone: (doc) => {
          const clonedElement = doc.querySelector(`.${container.className}`) as HTMLElement;
          if (clonedElement) {
            clonedElement.scrollTop = 0;
          }
        }
      });

      // 清理临时元素
      document.body.removeChild(wrapper);

      // 恢复原始状态
      Object.assign(container.style, originalStyle);
      container.scrollTop = originalStyle.scrollTop;

      // 转换为图片并下载
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `辩论记录_${new Date().toISOString().split('T')[0]}.png`;
      link.href = image;
      link.click();
      
      message.success('长图导出成功！');
    } catch (error) {
      console.error('长图导出失败:', error);
      message.error('长图导出失败，请重试');
    }
  }
} 