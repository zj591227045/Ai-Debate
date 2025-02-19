# UI 风格指南

## 1. 颜色系统

### 主色调
```css
/* 深蓝色渐变背景 */
background: linear-gradient(90deg, rgba(2,0,36,0.95) 0%, rgba(9,9,121,0.95) 35%, rgba(0,57,89,0.95) 100%);

/* 点缀色 - 银色系 */
color: #E8F0FF;  /* 主文字颜色 */
border-color: rgba(167,187,255,0.2);  /* 边框颜色 */
```

### 透明度层级
```css
/* 背景透明度 */
background: rgba(255, 255, 255, 0.05);  /* 容器背景 */
background: rgba(167,187,255,0.1);  /* 装饰线条 */

/* 文字透明度 */
color: rgba(232,240,255,0.9);  /* 正文文字 */
```

## 2. 容器样式

### 基础容器
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(10px);
border-radius: 20px;
border: 1px solid rgba(167,187,255,0.2);
box-shadow: 
  0 8px 32px 0 rgba(31, 38, 135, 0.37),
  inset 0 0 30px rgba(167,187,255,0.1);
```

### 背景纹理
```css
/* 网格纹理 */
background-image: 
  linear-gradient(rgba(167,187,255,0.1) 1px, transparent 1px),
  linear-gradient(90deg, rgba(167,187,255,0.1) 1px, transparent 1px);
background-size: 50px 50px;

/* 斜线纹理 */
repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(167,187,255,0.1) 10px, rgba(167,187,255,0.1) 11px),
repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(167,187,255,0.1) 10px, rgba(167,187,255,0.1) 11px);
```

## 3. 动画效果

### 发光动画
```css
@keyframes glowAnimation {
  0% {
    box-shadow: 0 0 5px rgba(167,187,255,0.3), 0 0 10px rgba(167,187,255,0.2), 0 0 15px rgba(167,187,255,0.1);
  }
  50% {
    box-shadow: 0 0 10px rgba(167,187,255,0.4), 0 0 20px rgba(167,187,255,0.3), 0 0 30px rgba(167,187,255,0.2);
  }
  100% {
    box-shadow: 0 0 5px rgba(167,187,255,0.3), 0 0 10px rgba(167,187,255,0.2), 0 0 15px rgba(167,187,255,0.1);
  }
}
```

### 悬浮效果
```css
transition: all 0.3s ease;

&:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(167,187,255,0.2);
}
```

### 光波纹效果
```css
position: relative;
overflow: hidden;

&:before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    120deg,
    transparent,
    rgba(167,187,255,0.3),
    transparent
  );
  transition: 0.5s;
}

&:hover:before {
  left: 100%;
}
```

## 4. 文字样式

### 标题
```css
color: #E8F0FF;
font-size: 2.5rem;
font-weight: 700;
text-shadow: 
  0 0 10px rgba(167,187,255,0.5),
  0 0 20px rgba(167,187,255,0.3),
  0 0 30px rgba(167,187,255,0.2);
```

### 正文
```css
color: rgba(232,240,255,0.9);
font-size: 1.2rem;
line-height: 1.6;
letter-spacing: 0.5px;
text-shadow: 0 0 10px rgba(167,187,255,0.3);
```

## 5. 交互元素

### 按钮
```css
/* 主按钮 */
background: linear-gradient(45deg, rgba(9,9,121,0.9), rgba(0,57,89,0.9));
color: #E8F0FF;
border: 1px solid rgba(167,187,255,0.3);
border-radius: 8px;
padding: 0.8rem 1.5rem;
font-size: 1rem;
font-weight: 600;

/* 次要按钮 */
background: rgba(167,187,255,0.1);
```

### 标签页
```css
/* 激活状态 */
background: linear-gradient(45deg, rgba(9,9,121,0.9), rgba(0,57,89,0.9));
text-shadow: 0 0 10px rgba(167,187,255,0.3);

/* 未激活状态 */
background: rgba(167,187,255,0.1);
```

## 6. 响应式设计

### 容器尺寸
```css
/* 内容容器 */
max-width: 800px;
width: 90%;
padding: 2rem;

/* 页面间距 */
gap: 1rem;
margin-bottom: 2rem;
```

## 7. 使用指南

### 新组件开发
1. 使用毛玻璃效果（backdrop-filter: blur）增加层次感
2. 添加适当的发光效果和阴影提升质感
3. 保持统一的圆角和边框样式
4. 使用渐变色而不是纯色
5. 为交互元素添加过渡动画

### 注意事项
1. 避免过度使用动画效果，以免影响性能
2. 确保文字对比度满足可读性要求
3. 保持风格的一致性，特别是颜色和间距
4. 合理使用透明度，避免层级混乱
5. 考虑移动端适配，确保响应式设计

## 8. 组件示例

### 基础容器
```tsx
const Container = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(167,187,255,0.2);
  padding: 2rem;
  box-shadow: 
    0 8px 32px 0 rgba(31, 38, 135, 0.37),
    inset 0 0 30px rgba(167,187,255,0.1);
`;
```

### 交互按钮
```tsx
const StyledButton = styled.button`
  padding: 0.8rem 1.5rem;
  background: linear-gradient(45deg, rgba(9,9,121,0.9), rgba(0,57,89,0.9));
  color: #E8F0FF;
  border: 1px solid rgba(167,187,255,0.3);
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(167,187,255,0.2);
  }
`;
```

## 9. UI 美化最佳实践

### 分层修改原则

1. **样式与功能分离**
   - 优先修改纯展示性的 CSS 属性（颜色、阴影、圆角等）
   - 不改变组件的结构和类名
   - 保持原有的事件处理器和状态管理
   - 使用 CSS-in-JS 时注意样式覆盖的优先级

2. **渐进式改进**
   ```tsx
   // ❌ 错误示范：直接修改组件结构
   const Button = styled.button`
     // 样式修改
   `;

   // ✅ 正确示范：继承现有组件
   const StyledButton = styled(Button)`
     // 样式修改
   `;
   ```

3. **组件包装模式**
   ```tsx
   // ❌ 错误示范：直接修改现有组件
   const ExistingComponent = () => {
     // 功能逻辑
     return <div>...</div>;
   };

   // ✅ 正确示范：创建样式包装器
   const StyledWrapper = styled.div`
     // 新的样式
   `;

   const EnhancedComponent = () => (
     <StyledWrapper>
       <ExistingComponent />
     </StyledWrapper>
   );
   ```

### 实施步骤

1. **评估阶段**
   - 记录需要修改的组件清单
   - 识别组件间的样式依赖关系
   - 确定样式修改的优先级
   - 创建样式修改的测试方案

2. **开发阶段**
   ```tsx
   // 1. 先创建样式常量
   const styleConstants = {
     shadows: {
       primary: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
       inner: 'inset 0 0 30px rgba(167,187,255,0.1)'
     },
     gradients: {
       primary: 'linear-gradient(45deg, rgba(9,9,121,0.9), rgba(0,57,89,0.9))'
     }
   };

   // 2. 创建基础样式组件
   const BaseContainer = styled.div`
     // 基础样式
   `;

   // 3. 扩展基础组件
   const EnhancedContainer = styled(BaseContainer)`
     // 特定样式
   `;
   ```

3. **测试阶段**
   - 编写视觉回归测试
   - 确保功能测试通过
   - 检查响应式布局
   - 验证浏览器兼容性

### 安全修改指南

1. **CSS 属性安全等级**
   ```css
   /* 安全等级：高（随时可改） */
   color
   background
   border
   box-shadow
   text-shadow
   transform
   opacity

   /* 安全等级：中（需要测试） */
   margin
   padding
   width
   height
   position
   display
   flex-related

   /* 安全等级：低（谨慎修改） */
   z-index
   position: fixed/absolute
   overflow
   pointer-events
   ```

2. **样式隔离策略**
   ```tsx
   // 使用特定前缀
   const StyledComponent = styled.div`
     &.ui-enhanced {
       // 新样式
     }
   `;

   // 使用主题变量
   const theme = {
     colors: {
       primary: 'rgba(9,9,121,0.9)',
       // ...
     }
   };
   ```

3. **性能优化考虑**
   - 避免过度使用 filter 和 backdrop-filter
   - 合理使用 transform 代替位置属性
   - 优化动画性能（使用 transform 和 opacity）
   - 控制阴影和模糊效果的复杂度

### 调试与维护

1. **样式调试工具**
   - 使用浏览器开发工具的 Elements 面板
   - 使用 React Developer Tools 检查组件层级
   - 使用 CSS-in-JS 的开发工具查看样式来源

2. **文档维护**
   ```tsx
   // 添加样式说明注释
   const StyledComponent = styled.div`
     /* 
      * @purpose: 实现毛玻璃效果
      * @dependency: 需要父元素设置背景
      * @performance: 注意在移动端的性能表现
      */
     backdrop-filter: blur(10px);
   `;
   ```

3. **版本控制**
   - 使用 Git 分支管理样式改动
   - 创建样式改动的专门提交
   - 在 PR 中附上视觉效果对比图

### 常见陷阱避免

1. **样式冲突**
   ```tsx
   // ❌ 避免使用全局选择器
   const GlobalStyle = createGlobalStyle`
     div { ... }
   `;

   // ✅ 使用特定的选择器
   const ScopedStyle = styled.div`
     &.specific-class { ... }
   `;
   ```

2. **性能问题**
   ```tsx
   // ❌ 避免频繁的样式计算
   const BadComponent = styled.div`
     ${props => props.dynamic && `
       // 大量的样式计算
     `}
   `;

   // ✅ 使用预定义的样式
   const GoodComponent = styled.div`
     ${props => props.variant === 'primary' && primaryStyles}
   `;
   ```

3. **维护性问题**
   ```tsx
   // ❌ 避免硬编码的值
   const BadComponent = styled.div`
     box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
   `;

   // ✅ 使用主题变量
   const GoodComponent = styled.div`
     box-shadow: ${props => props.theme.shadows.primary};
   `;
   ```

### 响应式设计考虑

1. **断点管理**
   ```tsx
   const breakpoints = {
     mobile: '320px',
     tablet: '768px',
     desktop: '1024px'
   };

   const media = {
     mobile: `@media (min-width: ${breakpoints.mobile})`,
     tablet: `@media (min-width: ${breakpoints.tablet})`,
     desktop: `@media (min-width: ${breakpoints.desktop})`
   };
   ```

2. **响应式样式编写**
   ```tsx
   const ResponsiveComponent = styled.div`
     padding: 1rem;

     ${media.tablet} {
       padding: 2rem;
     }

     ${media.desktop} {
       padding: 3rem;
     }
   `;
   ``` 