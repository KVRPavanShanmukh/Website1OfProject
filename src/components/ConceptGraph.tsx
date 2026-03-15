import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, BookOpen, Lock, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface Node {
  id: string;
  title: string;
  desc: string;
  prerequisites: string[];
  resources: { title: string; url: string }[];
}

const TOPICS: Node[] = [
  {
    id: 'arrays',
    title: 'Arrays & Hashing',
    desc: 'The foundation of data structures. Learn how to store and access data efficiently.',
    prerequisites: [],
    resources: [
      { title: 'Array Basics - GFG', url: 'https://www.geeksforgeeks.org/array-data-structure/' },
      { title: 'Hashing Explained', url: 'https://www.freecodecamp.org/news/what-is-hashing/' }
    ]
  },
  {
    id: 'two-pointers',
    title: 'Two Pointers',
    desc: 'Efficiently traverse arrays or strings using two indices.',
    prerequisites: ['arrays'],
    resources: [
      { title: 'Two Pointer Technique', url: 'https://leetcode.com/articles/two-pointer-technique/' }
    ]
  },
  {
    id: 'sliding-window',
    title: 'Sliding Window',
    desc: 'A sub-technique of two pointers for subarray problems.',
    prerequisites: ['arrays'],
    resources: [
      { title: 'Sliding Window Algorithm', url: 'https://www.geeksforgeeks.org/window-sliding-technique/' }
    ]
  },
  {
    id: 'stack',
    title: 'Stack',
    desc: 'Last-In-First-Out (LIFO) data structure.',
    prerequisites: ['arrays'],
    resources: [
      { title: 'Stack Data Structure', url: 'https://www.programiz.com/dsa/stack' }
    ]
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    desc: 'Logarithmic search in sorted data.',
    prerequisites: ['arrays'],
    resources: [
      { title: 'Binary Search Guide', url: 'https://www.khanacademy.org/computing/computer-science/algorithms/binary-search/a/binary-search' }
    ]
  },
  {
    id: 'linked-list',
    title: 'Linked List',
    desc: 'Dynamic data structure with nodes and pointers.',
    prerequisites: ['arrays'],
    resources: [
      { title: 'Linked List Basics', url: 'https://www.geeksforgeeks.org/data-structures/linked-list/' }
    ]
  },
  {
    id: 'trees',
    title: 'Trees & Recursion',
    desc: 'Hierarchical data structures and recursive thinking.',
    prerequisites: ['stack', 'linked-list'],
    resources: [
      { title: 'Binary Trees', url: 'https://www.geeksforgeeks.org/binary-tree-data-structure/' }
    ]
  },
  {
    id: 'graphs',
    title: 'Graphs',
    desc: 'Representing relationships between entities.',
    prerequisites: ['trees'],
    resources: [
      { title: 'Graph Theory', url: 'https://www.freecodecamp.org/news/graph-theory-basics-with-examples/' }
    ]
  },
  {
    id: 'dp',
    title: 'Dynamic Programming',
    desc: 'Optimization by breaking problems into subproblems.',
    prerequisites: ['trees'],
    resources: [
      { title: 'DP Introduction', url: 'https://www.geeksforgeeks.org/dynamic-programming/' }
    ]
  }
];

export const ConceptGraph: React.FC<{ completedTopics: string[] }> = ({ completedTopics }) => {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const isUnlocked = (node: Node) => {
    return node.prerequisites.every(p => completedTopics.includes(p));
  };

  const isCompleted = (node: Node) => completedTopics.includes(node.id);

  return (
    <div className="relative w-full py-12 px-4 overflow-hidden">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-black mb-2">Concept Dependency Graph</h2>
        <p className="text-zinc-400 text-sm">Master the foundations to unlock advanced topics.</p>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* SVG Connections (Simplified for this UI) */}
          <div className="absolute inset-0 pointer-events-none opacity-10">
            <svg className="w-full h-full">
              {/* We could draw lines here if we had fixed positions, 
                  but for a responsive grid, we'll use visual cues instead */}
            </svg>
          </div>

          {TOPICS.map((topic, idx) => {
            const unlocked = isUnlocked(topic);
            const completed = isCompleted(topic);

            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => unlocked && setSelectedNode(topic)}
                className={cn(
                  "relative group cursor-pointer p-6 rounded-3xl border transition-all duration-300",
                  completed 
                    ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50" 
                    : unlocked 
                      ? "bg-blue-500/5 border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/10"
                      : "bg-zinc-900/50 border-white/5 grayscale opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    completed ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                  )}>
                    {completed ? <CheckCircle2 className="w-5 h-5" /> : unlocked ? <BookOpen className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  {topic.prerequisites.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-end max-w-[100px]">
                      {topic.prerequisites.map(p => (
                        <span key={p} className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-500 border border-white/5 uppercase font-bold">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-lg mb-1 group-hover:text-blue-400 transition-colors">{topic.title}</h3>
                <p className="text-xs text-zinc-500 line-clamp-2">{topic.desc}</p>

                {unlocked && !completed && (
                  <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                    <span>Unlock Next</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-[40px] p-8 max-w-lg w-full relative shadow-2xl"
            >
              <button 
                onClick={() => setSelectedNode(null)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-black">{selectedNode.title}</h2>
                  <div className="flex items-center gap-2 text-zinc-500 text-xs mt-1">
                    <Info className="w-3 h-3" />
                    <span>Prerequisites: {selectedNode.prerequisites.join(', ') || 'None'}</span>
                  </div>
                </div>
              </div>

              <p className="text-zinc-400 mb-8 leading-relaxed">
                {selectedNode.desc}
              </p>

              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Recommended Resources</h4>
                {selectedNode.resources.map((res, i) => (
                  <a 
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all group"
                  >
                    <span className="font-bold text-sm group-hover:text-blue-400">{res.title}</span>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400" />
                  </a>
                ))}
              </div>

              <button 
                onClick={() => setSelectedNode(null)}
                className="w-full mt-8 py-4 bg-blue-500 text-black rounded-2xl font-bold hover:bg-blue-400 transition-all active:scale-95"
              >
                Close Topic
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
