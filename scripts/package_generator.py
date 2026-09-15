#!/usr/bin/env python3
"""
AI 学习包生成器
支持从文本/PDF/网页等来源自动生成学习包

用法:
    python package_generator.py vocab <input.txt> <output.json>  # 从词汇列表生成
    python package_generator.py extract <source.pdf> <output.json>  # 从PDF提取
"""

import json
import sys
import re
import os


def generate_vocab_package(input_file, output_file, title="自定义词汇"):
    """从词汇列表文本生成学习包
    
    文本格式（每行一个单词）:
        单词 词性 释义
        单词 释义
    """
    items = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for idx, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        
        # 尝试匹配: 单词 + 词性 + 释义
        pos_pattern = r'((?:n\.|vt\.|vi\.|a\.|ad\.|prep\.|conj\.|pron\.)(?:&(?:n\.|vt\.|vi\.|a\.|ad\.|prep\.|conj\.|pron\.))*)'
        match = re.match(r'^([a-zA-Z][a-zA-Z\-\']*)\s+' + pos_pattern + r'\s*(.+)$', line)
        
        if match:
            word = match.group(1)
            pos = match.group(2)
            meaning = match.group(3)
        else:
            # 尝试: 单词 + 释义（没有词性）
            match = re.match(r'^([a-zA-Z][a-zA-Z\-\']*)\s+(.+)$', line)
            if match:
                word = match.group(1)
                pos = ''
                meaning = match.group(2)
            else:
                continue
        
        items.append({
            'id': f'word_{idx+1:04d}',
            'front': word,
            'back': meaning,
            'extra': {
                'pos': pos,
                'tags': ['自定义']
            }
        })
    
    package = {
        'package_id': os.path.splitext(os.path.basename(output_file))[0],
        'title': title,
        'type': 'vocabulary',
        'description': f'自定义词汇包，共{len(items)}词',
        'total_items': len(items),
        'items': items
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(package, f, ensure_ascii=False, indent=2)
    
    print(f"已生成学习包: {output_file}")
    print(f"包含词汇: {len(items)} 个")
    return package


def generate_knowledge_package(qa_pairs, output_file, title="知识点学习包"):
    """从问答对生成知识点学习包（通用知识类）
    
    qa_pairs 格式:
    [
        {"question": "问题", "answer": "答案"},
        ...
    ]
    """
    items = []
    
    for idx, qa in enumerate(qa_pairs):
        items.append({
            'id': f'item_{idx+1:04d}',
            'front': qa['question'],
            'back': qa['answer'],
            'extra': {
                'tags': qa.get('tags', [])
            }
        })
    
    package = {
        'package_id': os.path.splitext(os.path.basename(output_file))[0],
        'title': title,
        'type': 'knowledge',
        'description': f'知识点学习包，共{len(items)}项',
        'total_items': len(items),
        'items': items
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(package, f, ensure_ascii=False, indent=2)
    
    print(f"已生成学习包: {output_file}")
    print(f"包含知识点: {len(items)} 项")
    return package


def main():
    if len(sys.argv) < 3:
        print("""用法:
    python package_generator.py vocab <input.txt> <output.json> [标题]
    python package_generator.py template <output.json>     # 生成模板
        """)
        sys.exit(1)
    
    cmd = sys.argv[1]
    
    if cmd == 'vocab':
        input_file = sys.argv[2]
        output_file = sys.argv[3] if len(sys.argv) > 3 else 'output.json'
        title = sys.argv[4] if len(sys.argv) > 4 else '自定义词汇'
        generate_vocab_package(input_file, output_file, title)
    
    elif cmd == 'template':
        output_file = sys.argv[2] if len(sys.argv) > 2 else 'template.json'
        # 生成一个模板
        template = {
            "package_id": "my-package",
            "title": "我的学习包",
            "type": "vocabulary",
            "description": "学习包描述",
            "total_items": 3,
            "items": [
                {
                    "id": "item_0001",
                    "front": "单词/问题",
                    "back": "释义/答案",
                    "extra": {
                        "pos": "n.",
                        "tags": ["标签1", "标签2"]
                    }
                }
            ]
        }
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(template, f, ensure_ascii=False, indent=2)
        print(f"模板已生成: {output_file}")
    
    else:
        print(f"未知命令: {cmd}")
        sys.exit(1)


if __name__ == '__main__':
    main()
