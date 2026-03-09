export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  starterCode: string;
  testCases: {
    input: any[];
    expected: any;
  }[];
}

export const challenges: Challenge[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    category: 'Arrays',
    difficulty: 'Easy',
    description: 'Write a function `twoSum(nums, target)` that returns the indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution.',
    starterCode: `function twoSum(nums, target) {\n  // Your code here\n}`,
    testCases: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2] }
    ]
  },
  {
    id: 'reverse-string',
    title: 'Reverse String',
    category: 'Strings',
    difficulty: 'Easy',
    description: 'Write a function `reverseString(s)` that reverses a string.',
    starterCode: `function reverseString(s) {\n  // Your code here\n}`,
    testCases: [
      { input: ['hello'], expected: 'olleh' },
      { input: ['Hannah'], expected: 'hannaH' }
    ]
  },
  {
    id: 'fibonacci',
    title: 'Fibonacci Number',
    category: 'Recursion',
    difficulty: 'Easy',
    description: 'The Fibonacci numbers, commonly denoted F(n) form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1. Given n, calculate F(n).',
    starterCode: `function fib(n) {\n  // Your code here\n}`,
    testCases: [
      { input: [2], expected: 1 },
      { input: [3], expected: 2 },
      { input: [4], expected: 3 }
    ]
  },
  {
    id: 'valid-palindrome',
    title: 'Valid Palindrome',
    category: 'Strings',
    difficulty: 'Easy',
    description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.',
    starterCode: `function isPalindrome(s) {\n  // Your code here\n}`,
    testCases: [
      { input: ["A man, a plan, a canal: Panama"], expected: true },
      { input: ["race a car"], expected: false }
    ]
  },
  {
    id: 'bubble-sort',
    title: 'Bubble Sort',
    category: 'Algorithms',
    difficulty: 'Medium',
    description: 'Implement a bubble sort algorithm to sort an array of numbers in ascending order.',
    starterCode: `function bubbleSort(arr) {\n  // Your code here\n}`,
    testCases: [
      { input: [[5, 3, 8, 4, 2]], expected: [2, 3, 4, 5, 8] },
      { input: [[1, 2, 3]], expected: [1, 2, 3] }
    ]
  },
  {
    id: 'max-subarray',
    title: 'Maximum Subarray',
    category: 'Algorithms',
    difficulty: 'Medium',
    description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
    starterCode: `function maxSubArray(nums) {\n  // Your code here\n}`,
    testCases: [
      { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { input: [[1]], expected: 1 }
    ]
  },
  {
    id: 'stack-implementation',
    title: 'Min Stack',
    category: 'Data Structures',
    difficulty: 'Medium',
    description: 'Implement a stack that supports push, pop, top, and retrieving the minimum element in constant time. Return the min element for a sequence of operations.',
    starterCode: `function getMin(ops) {\n  // ops is array of {type: "push"|"pop", val?: number}\n  // return the final min\n}`,
    testCases: [
      { input: [[{type: "push", val: -2}, {type: "push", val: 0}, {type: "push", val: -3}]], expected: -3 }
    ]
  }
];
