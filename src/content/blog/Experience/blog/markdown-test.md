---
title: 'markdown渲染测试'
summary: '用于测试 Markdown 渲染对各种语法的支持情况'
date: '2025年11月21日'
tags: ['经验分享']
---

## 1. 文本样式

**加粗文本**

*斜体文本*

***粗斜体文本***

~~删除线文本~~

`行内代码`

<u>下划线</u>

==高亮文本==  

H~2~O (下标)  

X^2^ (上标)

<kbd>Ctrl</kbd> + <kbd>C</kbd>

---

## 2. 列表 (Lists)

### 2.1 无序列表

- 水果
  - 苹果
  - 香蕉
  - 橙子
- 蔬菜
  - 胡萝卜
  - 西红柿
    - 小番茄
  - 黄瓜
- 主食
  - 米饭
  - 面条
  - 面包

### 2.2 有序列表

1. 准备食材
2. 烹饪步骤
    1. 清洗食材
    2. 切配食材
      1. 切丝
      2. 切片
3. 装盘上桌


### 2.3 任务列表

- [x] 购买食材
- [x] 准备工具
- [ ] 开始烹饪
  - [x] 清洗食材
  - [ ] 切配食材
- [ ] 完成料理

---

## 3. 引用

> 今天天气真好
>
> > 适合出去散步
>
> 一起去公园吧

---

## 4. 代码块

### 4.1 短代码块

```python
def add(a, b):
    return a + b

result = add(1, 2)
print(result)
``` 

### 4.2 长代码块

```python
# 计算器类示例
class Calculator:
    def __init__(self):
        self.result = 0
    
    def add(self, x):
        self.result += x
        return self
    
    def subtract(self, x):
        self.result -= x
        return self
    
    def multiply(self, x):
        self.result *= x
        return self
    
    def divide(self, x):
        if x != 0:
            self.result /= x
        else:
            print("错误：不能除以零")
        return self
    
    def get_result(self):
        return self.result

# 使用示例
calc = Calculator()
result = calc.add(10).multiply(2).subtract(5).get_result()
print(f"计算结果: {result}")

# 另一个示例：处理列表
numbers = [1, 2, 3, 4, 5]
squared = [x * x for x in numbers]
filtered = [x for x in squared if x > 10]
print(f"原列表: {numbers}")
print(f"平方后: {squared}")
print(f"大于10的: {filtered}")
``` 

---

## 5. 链接

### 5.1 普通链接

[bilibili](https://www.bilibili.com/)  

### 5.2 带tooltip的链接

[bilibili](https://markdown.com.cn "哔哩哔哩 (゜-゜)つロ 干杯~-bilibili")  

### 5.3 带图标的链接

[bilibili](https://markdown.com.cn){fa6-brands:bilibili}   

> 图标库   
> https://yesicon.app/  
> https://lucide.dev/icons/  

---

## 6. 图片

![alt text](https://cdn.atao.cyou/Web/Avatar.png){align:left, width:10%, caption:示例图片}

---

## 7. 视频

:::video{width:95%, align:center, controls:true, caption:示例视频}
https://cdn.atao.cyou/Blog/blog_250312_222911.mp4
:::

---

## 8. 表格

| 水果 | 价格 | 数量 | 说明 |
| :--- | :---: | :--- | :--- |
| 苹果 | ¥10 | 5个 | 新鲜红富士 |
| 香蕉 | ¥8 | 3把 | 进口香蕉 |
| 橙子 | ¥12 | 4个 | 甜橙 |
| 葡萄 | ¥15 | 2串 | 无籽葡萄 |
| 草莓 | ¥20 | 1盒 | 有机草莓 |

---

## 9. 标签页

:::tabs
@tab 苹果
苹果是一种常见的水果，富含维生素C。

@tab 香蕉
香蕉口感香甜，营养丰富。

@tab 橙子
橙子含有丰富的维生素，有助于增强免疫力。
:::

---

## 10. 时间线

:::timeline
@item 2025-01-01 | 开始学习
开始学习新的技能

@item 2025-06-01 | 完成项目
成功完成第一个项目

@item 2025-12-01 | 获得认证
通过专业认证考试
:::

---

## 11. 链接卡片

:::link-card{url:https://ys.mihoyo.com/main/, title:原神, description:开放世界冒险RPG游戏，探索提瓦特大陆的奇幻之旅, image:https://webstatic.mihoyo.com/bh3/upload/officialsites/201908/ys_1565764084_7084.png}
:::

---

## 12. 提示

### 12.1 info

:::alert{type:info, title:提示}
今天天气不错，适合出门
:::

### 12.2 success

:::alert{type:success, title:成功}
任务已完成
:::

### 12.3 warning

:::alert{type:warning, title:警告}
记得带伞，可能会下雨
:::

### 12.4 error

:::alert{type:error, title:错误}
操作失败，请重试
:::

---

## 13. 图表

### 13.1 折线图

:::chart
{
  "title": {
    "text": "温度变化"
  },
  "tooltip": {
    "trigger": "axis"
  },
  "xAxis": {
    "type": "category",
    "data": ["周一", "周二", "周三", "周四", "周五"]
  },
  "yAxis": {
    "type": "value"
  },
  "series": [
    {
      "name": "温度",
      "type": "line",
      "data": [20, 22, 18, 25, 23]
    }
  ]
}
:::


### 13.2 柱状图

:::chart
{
  "title": {
    "text": "销量统计"
  },
  "tooltip": {
    "trigger": "axis"
  },
  "xAxis": {
    "type": "category",
    "data": ["苹果", "香蕉", "橙子", "葡萄"]
  },
  "yAxis": {
    "type": "value"
  },
  "series": [
    {
      "name": "销量",
      "type": "bar",
      "data": [50, 30, 40, 25]
    }
  ]
}
:::

### 13.3 饼图

:::chart
{
  "title": {
    "text": "水果占比",
    "left": "center"
  },
  "tooltip": {
    "trigger": "item"
  },
  "series": [
    {
      "name": "水果",
      "type": "pie",
      "radius": "50%",
      "data": [
        { "value": 40, "name": "苹果" },
        { "value": 30, "name": "香蕉" },
        { "value": 20, "name": "橙子" },
        { "value": 10, "name": "其他" }
      ]
    }
  ]
}
:::

### 13.4 雷达图

:::chart
{
  "title": {
    "text": "能力评估"
  },
  "tooltip": {
    "trigger": "item"
  },
  "radar": {
    "indicator": [
      { "name": "速度", "max": 100 },
      { "name": "力量", "max": 100 },
      { "name": "技巧", "max": 100 },
      { "name": "耐力", "max": 100 }
    ]
  },
  "series": [
    {
      "name": "能力",
      "type": "radar",
      "data": [
        {
          "value": [80, 70, 85, 75],
          "name": "当前"
        }
      ]
    }
  ]
}
:::

