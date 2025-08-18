import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Settings, X, Play, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

// Comprehensive Vocabulary Database (13 Categories + ABC)
const VOCABULARY = {
  core: {
    name: '⭐ Core Words',
    color: 'bg-yellow-500',
    words: [
      { id: 'i', text: 'I', emoji: '👤' },
      { id: 'you', text: 'you', emoji: '👥' },
      { id: 'want', text: 'want', emoji: '🙏' },
      { id: 'need', text: 'need', emoji: '❗' },
      { id: 'like', text: 'like', emoji: '❤️' },
      { id: 'dont', text: "don't", emoji: '❌' },
      { id: 'yes', text: 'yes', emoji: '✅' },
      { id: 'no', text: 'no', emoji: '🚫' },
      { id: 'please', text: 'please', emoji: '🙏' },
      { id: 'thankyou', text: 'thank you', emoji: '😊' },
      { id: 'help', text: 'help', emoji: '🆘' },
      { id: 'more', text: 'more', emoji: '➕' },
      { id: 'stop', text: 'stop', emoji: '🛑' },
      { id: 'go', text: 'go', emoji: '➡️' },
      { id: 'come', text: 'come', emoji: '👋' },
      { id: 'here', text: 'here', emoji: '📍' },
      { id: 'there', text: 'there', emoji: '👉' },
      { id: 'this', text: 'this', emoji: '👆' },
      { id: 'that', text: 'that', emoji: '👉' },
      { id: 'good', text: 'good', emoji: '👍' },
      { id: 'bad', text: 'bad', emoji: '👎' },
      { id: 'big', text: 'big', emoji: '🔍' },
      { id: 'small', text: 'small', emoji: '🔬' },
      { id: 'hot', text: 'hot', emoji: '🔥' },
      { id: 'cold', text: 'cold', emoji: '🧊' }
    ]
  },
  actions: {
    name: '🚪 Actions',
    color: 'bg-blue-500',
    words: [
      { id: 'open', text: 'open', emoji: '🚪' },
      { id: 'close', text: 'close', emoji: '🚪' },
      { id: 'turnon', text: 'turn on', emoji: '💡' },
      { id: 'turnoff', text: 'turn off', emoji: '💡' },
      { id: 'sitdown', text: 'sit down', emoji: '🪑' },
      { id: 'standup', text: 'stand up', emoji: '🧍' },
      { id: 'pickup', text: 'pick up', emoji: '✋' },
      { id: 'putdown', text: 'put down', emoji: '👇' },
      { id: 'giveme', text: 'give me', emoji: '🤲' },
      { id: 'takethis', text: 'take this', emoji: '🤝' },
      { id: 'push', text: 'push', emoji: '👐' },
      { id: 'pull', text: 'pull', emoji: '🤜' },
      { id: 'throwaway', text: 'throw away', emoji: '🗑️' },
      { id: 'clean', text: 'clean', emoji: '🧽' },
      { id: 'wash', text: 'wash', emoji: '🧼' },
      { id: 'dry', text: 'dry', emoji: '🌬️' },
      { id: 'cut', text: 'cut', emoji: '✂️' },
      { id: 'fold', text: 'fold', emoji: '📂' },
      { id: 'fix', text: 'fix', emoji: '🔧' },
      { id: 'break', text: 'break', emoji: '💥' },
      { id: 'make', text: 'make', emoji: '🔨' },
      { id: 'build', text: 'build', emoji: '🏗️' },
      { id: 'move', text: 'move', emoji: '🚚' },
      { id: 'carry', text: 'carry', emoji: '🎒' },
      { id: 'hold', text: 'hold', emoji: '🤲' }
    ]
  },
  emergency: {
    name: '🚨 Emergency',
    color: 'bg-red-500',
    words: [
      { id: 'emergency', text: 'emergency', emoji: '🚨' },
      { id: 'pain', text: 'pain', emoji: '😣' },
      { id: 'hurt', text: 'hurt', emoji: '🤕' },
      { id: 'sick', text: 'sick', emoji: '🤒' },
      { id: 'cantbreathe', text: "can't breathe", emoji: '🫁' },
      { id: 'dizzy', text: 'dizzy', emoji: '😵' },
      { id: 'scared', text: 'scared', emoji: '😰' },
      { id: 'lost', text: 'lost', emoji: '🗺️' },
      { id: 'call911', text: 'call 911', emoji: '📞' },
      { id: 'callmom', text: 'call mom', emoji: '👩' },
      { id: 'calldad', text: 'call dad', emoji: '👨' },
      { id: 'needdoctor', text: 'need doctor', emoji: '👩‍⚕️' },
      { id: 'allergic', text: 'allergic', emoji: '⚠️' },
      { id: 'danger', text: 'danger', emoji: '⚡' },
      { id: 'safe', text: 'safe', emoji: '🛡️' },
      { id: 'fire', text: 'fire', emoji: '🔥' },
      { id: 'smoke', text: 'smoke', emoji: '💨' },
      { id: 'bleeding', text: 'bleeding', emoji: '🩸' },
      { id: 'choking', text: 'choking', emoji: '😵' },
      { id: 'fell', text: 'fell', emoji: '⬇️' },
      { id: 'stuck', text: 'stuck', emoji: '🚫' },
      { id: 'broken', text: 'broken', emoji: '💔' },
      { id: 'medicine', text: 'medicine', emoji: '💊' },
      { id: 'hospital', text: 'hospital', emoji: '🏥' },
      { id: 'ambulance', text: 'ambulance', emoji: '🚑' }
    ]
  },
  body: {
    name: '👤 Body Parts',
    color: 'bg-pink-500',
    words: [
      { id: 'head', text: 'head', emoji: '🗣️' },
      { id: 'face', text: 'face', emoji: '😊' },
      { id: 'eyes', text: 'eyes', emoji: '👀' },
      { id: 'nose', text: 'nose', emoji: '👃' },
      { id: 'mouth', text: 'mouth', emoji: '👄' },
      { id: 'ears', text: 'ears', emoji: '👂' },
      { id: 'teeth', text: 'teeth', emoji: '🦷' },
      { id: 'hair', text: 'hair', emoji: '💇' },
      { id: 'neck', text: 'neck', emoji: '🦒' },
      { id: 'shoulders', text: 'shoulders', emoji: '🤷' },
      { id: 'arms', text: 'arms', emoji: '💪' },
      { id: 'hands', text: 'hands', emoji: '👐' },
      { id: 'fingers', text: 'fingers', emoji: '🤞' },
      { id: 'chest', text: 'chest', emoji: '🫁' },
      { id: 'back', text: 'back', emoji: '🔙' },
      { id: 'stomach', text: 'stomach', emoji: '🤰' },
      { id: 'legs', text: 'legs', emoji: '🦵' },
      { id: 'knees', text: 'knees', emoji: '🦵' },
      { id: 'feet', text: 'feet', emoji: '🦶' },
      { id: 'toes', text: 'toes', emoji: '🦶' },
      { id: 'skin', text: 'skin', emoji: '👋' },
      { id: 'bone', text: 'bone', emoji: '🦴' },
      { id: 'muscle', text: 'muscle', emoji: '💪' },
      { id: 'heart', text: 'heart', emoji: '❤️' },
      { id: 'brain', text: 'brain', emoji: '🧠' }
    ]
  },
  animals: {
    name: '🐕 Pets & Animals',
    color: 'bg-green-500',
    words: [
      { id: 'dog', text: 'dog', emoji: '🐕' },
      { id: 'cat', text: 'cat', emoji: '🐱' },
      { id: 'puppy', text: 'puppy', emoji: '🐶' },
      { id: 'kitten', text: 'kitten', emoji: '🐱' },
      { id: 'bird', text: 'bird', emoji: '🐦' },
      { id: 'fish', text: 'fish', emoji: '🐠' },
      { id: 'rabbit', text: 'rabbit', emoji: '🐰' },
      { id: 'hamster', text: 'hamster', emoji: '🐹' },
      { id: 'turtle', text: 'turtle', emoji: '🐢' },
      { id: 'horse', text: 'horse', emoji: '🐴' },
      { id: 'cow', text: 'cow', emoji: '🐄' },
      { id: 'pig', text: 'pig', emoji: '🐷' },
      { id: 'sheep', text: 'sheep', emoji: '🐑' },
      { id: 'chicken', text: 'chicken', emoji: '🐔' },
      { id: 'duck', text: 'duck', emoji: '🦆' },
      { id: 'elephant', text: 'elephant', emoji: '🐘' },
      { id: 'lion', text: 'lion', emoji: '🦁' },
      { id: 'tiger', text: 'tiger', emoji: '🐅' },
      { id: 'bear', text: 'bear', emoji: '🐻' },
      { id: 'monkey', text: 'monkey', emoji: '🐵' },
      { id: 'snake', text: 'snake', emoji: '🐍' },
      { id: 'frog', text: 'frog', emoji: '🐸' },
      { id: 'spider', text: 'spider', emoji: '🕷️' },
      { id: 'bee', text: 'bee', emoji: '🐝' },
      { id: 'butterfly', text: 'butterfly', emoji: '🦋' }
    ]
  },
  feelings: {
    name: '😊 Feelings',
    color: 'bg-purple-500',
    words: [
      { id: 'happy', text: 'happy', emoji: '😊' },
      { id: 'sad', text: 'sad', emoji: '😢' },
      { id: 'angry', text: 'angry', emoji: '😠' },
      { id: 'excited', text: 'excited', emoji: '🤩' },
      { id: 'tired', text: 'tired', emoji: '😴' },
      { id: 'hungry', text: 'hungry', emoji: '🤤' },
      { id: 'thirsty', text: 'thirsty', emoji: '🥤' },
      { id: 'love', text: 'love', emoji: '❤️' },
      { id: 'worried', text: 'worried', emoji: '😟' },
      { id: 'calm', text: 'calm', emoji: '😌' },
      { id: 'surprised', text: 'surprised', emoji: '😲' },
      { id: 'confused', text: 'confused', emoji: '😕' },
      { id: 'proud', text: 'proud', emoji: '😤' },
      { id: 'sorry', text: 'sorry', emoji: '😔' },
      { id: 'frustrated', text: 'frustrated', emoji: '😤' },
      { id: 'nervous', text: 'nervous', emoji: '😰' },
      { id: 'comfortable', text: 'comfortable', emoji: '😌' },
      { id: 'mad', text: 'mad', emoji: '😡' },
      { id: 'silly', text: 'silly', emoji: '🤪' },
      { id: 'brave', text: 'brave', emoji: '🦸' }
    ]
  },
  food: {
    name: '🍎 Food & Drink',
    color: 'bg-orange-500',
    words: [
      { id: 'apple', text: 'apple', emoji: '🍎' },
      { id: 'banana', text: 'banana', emoji: '🍌' },
      { id: 'orange', text: 'orange', emoji: '🍊' },
      { id: 'bread', text: 'bread', emoji: '🍞' },
      { id: 'milk', text: 'milk', emoji: '🥛' },
      { id: 'water', text: 'water', emoji: '💧' },
      { id: 'juice', text: 'juice', emoji: '🧃' },
      { id: 'cookie', text: 'cookie', emoji: '🍪' },
      { id: 'pizza', text: 'pizza', emoji: '🍕' },
      { id: 'sandwich', text: 'sandwich', emoji: '🥪' },
      { id: 'chicken', text: 'chicken', emoji: '🍗' },
      { id: 'rice', text: 'rice', emoji: '🍚' },
      { id: 'pasta', text: 'pasta', emoji: '🍝' },
      { id: 'salad', text: 'salad', emoji: '🥗' },
      { id: 'soup', text: 'soup', emoji: '🍲' },
      { id: 'cereal', text: 'cereal', emoji: '🥣' },
      { id: 'yogurt', text: 'yogurt', emoji: '🥛' },
      { id: 'cheese', text: 'cheese', emoji: '🧀' },
      { id: 'egg', text: 'egg', emoji: '🥚' },
      { id: 'fishfood', text: 'fish', emoji: '🐟' },
      { id: 'cake', text: 'cake', emoji: '🎂' },
      { id: 'ice cream', text: 'ice cream', emoji: '🍦' },
      { id: 'candy', text: 'candy', emoji: '🍬' },
      { id: 'chocolate', text: 'chocolate', emoji: '🍫' },
      { id: 'fruit', text: 'fruit', emoji: '🍓' }
    ]
  },
  activities: {
    name: '🎮 Activities',
    color: 'bg-indigo-500',
    words: [
      { id: 'play', text: 'play', emoji: '🎮' },
      { id: 'read', text: 'read', emoji: '📚' },
      { id: 'watch', text: 'watch', emoji: '📺' },
      { id: 'listen', text: 'listen', emoji: '👂' },
      { id: 'draw', text: 'draw', emoji: '✏️' },
      { id: 'write', text: 'write', emoji: '✍️' },
      { id: 'sing', text: 'sing', emoji: '🎤' },
      { id: 'dance', text: 'dance', emoji: '💃' },
      { id: 'run', text: 'run', emoji: '🏃' },
      { id: 'walk', text: 'walk', emoji: '🚶' },
      { id: 'swim', text: 'swim', emoji: '🏊' },
      { id: 'jump', text: 'jump', emoji: '🦘' },
      { id: 'sleep', text: 'sleep', emoji: '😴' },
      { id: 'eat', text: 'eat', emoji: '🍽️' },
      { id: 'drink', text: 'drink', emoji: '🥤' },
      { id: 'work', text: 'work', emoji: '💼' },
      { id: 'study', text: 'study', emoji: '📖' },
      { id: 'exercise', text: 'exercise', emoji: '🏋️' },
      { id: 'cook', text: 'cook', emoji: '👩‍🍳' },
      { id: 'shop', text: 'shop', emoji: '🛒' },
      { id: 'drive', text: 'drive', emoji: '🚗' },
      { id: 'travel', text: 'travel', emoji: '✈️' },
      { id: 'visit', text: 'visit', emoji: '🏠' },
      { id: 'call', text: 'call', emoji: '📞' },
      { id: 'text', text: 'text', emoji: '📱' }
    ]
  },
  people: {
    name: '👨‍👩‍👧‍👦 People',
    color: 'bg-cyan-500',
    words: [
      { id: 'mom', text: 'mom', emoji: '👩' },
      { id: 'dad', text: 'dad', emoji: '👨' },
      { id: 'sister', text: 'sister', emoji: '👧' },
      { id: 'brother', text: 'brother', emoji: '👦' },
      { id: 'grandma', text: 'grandma', emoji: '👵' },
      { id: 'grandpa', text: 'grandpa', emoji: '👴' },
      { id: 'teacher', text: 'teacher', emoji: '👩‍🏫' },
      { id: 'friend', text: 'friend', emoji: '👫' },
      { id: 'doctor', text: 'doctor', emoji: '👩‍⚕️' },
      { id: 'nurse', text: 'nurse', emoji: '👩‍⚕️' },
      { id: 'baby', text: 'baby', emoji: '👶' },
      { id: 'family', text: 'family', emoji: '👨‍👩‍👧‍👦' },
      { id: 'aunt', text: 'aunt', emoji: '👩' },
      { id: 'uncle', text: 'uncle', emoji: '👨' },
      { id: 'cousin', text: 'cousin', emoji: '👫' },
      { id: 'neighbor', text: 'neighbor', emoji: '🏠' },
      { id: 'classmate', text: 'classmate', emoji: '👥' },
      { id: 'therapist', text: 'therapist', emoji: '👩‍⚕️' },
      { id: 'caregiver', text: 'caregiver', emoji: '🤗' },
      { id: 'helper', text: 'helper', emoji: '🙋' }
    ]
  },
  places: {
    name: '🏠 Places',
    color: 'bg-teal-500',
    words: [
      { id: 'home', text: 'home', emoji: '🏠' },
      { id: 'school', text: 'school', emoji: '🏫' },
      { id: 'park', text: 'park', emoji: '🌳' },
      { id: 'store', text: 'store', emoji: '🏪' },
      { id: 'hospitalplace', text: 'hospital', emoji: '🏥' },
      { id: 'library', text: 'library', emoji: '📚' },
      { id: 'restaurant', text: 'restaurant', emoji: '🍽️' },
      { id: 'playground', text: 'playground', emoji: '🛝' },
      { id: 'beach', text: 'beach', emoji: '🏖️' },
      { id: 'car', text: 'car', emoji: '🚗' },
      { id: 'bus', text: 'bus', emoji: '🚌' },
      { id: 'bedroom', text: 'bedroom', emoji: '🛏️' },
      { id: 'kitchen', text: 'kitchen', emoji: '🍳' },
      { id: 'outside', text: 'outside', emoji: '🌞' },
      { id: 'inside', text: 'inside', emoji: '🏠' },
      { id: 'upstairs', text: 'upstairs', emoji: '⬆️' },
      { id: 'downstairs', text: 'downstairs', emoji: '⬇️' },
      { id: 'office', text: 'office', emoji: '🏢' },
      { id: 'mall', text: 'mall', emoji: '🏬' },
      { id: 'zoo', text: 'zoo', emoji: '🦁' },
      { id: 'museum', text: 'museum', emoji: '🏛️' },
      { id: 'church', text: 'church', emoji: '⛪' },
      { id: 'gym', text: 'gym', emoji: '🏋️' },
      { id: 'pool', text: 'pool', emoji: '🏊' },
      { id: 'movie', text: 'movie theater', emoji: '🎬' }
    ]
  },
  bathroom: {
    name: '🚽 Bathroom',
    color: 'bg-blue-400',
    words: [
      { id: 'bathroom', text: 'bathroom', emoji: '🚽' },
      { id: 'toilet', text: 'toilet', emoji: '🚽' },
      { id: 'potty', text: 'potty', emoji: '🚽' },
      { id: 'pee', text: 'pee', emoji: '💧' },
      { id: 'poop', text: 'poop', emoji: '💩' },
      { id: 'washhands', text: 'wash hands', emoji: '🧼' },
      { id: 'soap', text: 'soap', emoji: '🧼' },
      { id: 'towel', text: 'towel', emoji: '🪣' },
      { id: 'tissue', text: 'tissue', emoji: '🧻' },
      { id: 'flush', text: 'flush', emoji: '🚽' },
      { id: 'wipe', text: 'wipe', emoji: '🧻' },
      { id: 'dirty', text: 'dirty', emoji: '🦠' },
      { id: 'finished', text: 'finished', emoji: '✅' },
      { id: 'privacy', text: 'privacy', emoji: '🚪' },
      { id: 'helpme', text: 'help me', emoji: '🆘' },
      { id: 'alldone', text: 'all done', emoji: '✅' },
      { id: 'accident', text: 'accident', emoji: '😳' },
      { id: 'underwear', text: 'underwear', emoji: '🩲' },
      { id: 'diaper', text: 'diaper', emoji: '👶' },
      { id: 'wet', text: 'wet', emoji: '💧' }
    ]
  },
  numbers: {
    name: '🔢 Numbers',
    color: 'bg-gray-500',
    words: [
      { id: 'zero', text: '0', emoji: '0️⃣' },
      { id: 'one', text: '1', emoji: '1️⃣' },
      { id: 'two', text: '2', emoji: '2️⃣' },
      { id: 'three', text: '3', emoji: '3️⃣' },
      { id: 'four', text: '4', emoji: '4️⃣' },
      { id: 'five', text: '5', emoji: '5️⃣' },
      { id: 'six', text: '6', emoji: '6️⃣' },
      { id: 'seven', text: '7', emoji: '7️⃣' },
      { id: 'eight', text: '8', emoji: '8️⃣' },
      { id: 'nine', text: '9', emoji: '9️⃣' },
      { id: 'ten', text: '10', emoji: '🔟' },
      { id: 'first', text: 'first', emoji: '🥇' },
      { id: 'second', text: 'second', emoji: '🥈' },
      { id: 'third', text: 'third', emoji: '🥉' },
      { id: 'many', text: 'many', emoji: '♾️' },
      { id: 'few', text: 'few', emoji: '🤏' },
      { id: 'all', text: 'all', emoji: '💯' },
      { id: 'some', text: 'some', emoji: '✋' },
      { id: 'none', text: 'none', emoji: '🚫' },
      { id: 'count', text: 'count', emoji: '🔢' }
    ]
  },
  colors: {
    name: '🌈 Colors',
    color: 'bg-pink-400',
    words: [
      { id: 'red', text: 'red', emoji: '🔴' },
      { id: 'blue', text: 'blue', emoji: '🔵' },
      { id: 'green', text: 'green', emoji: '🟢' },
      { id: 'yellow', text: 'yellow', emoji: '🟡' },
      { id: 'orange', text: 'orange', emoji: '🟠' },
      { id: 'purple', text: 'purple', emoji: '🟣' },
      { id: 'pink', text: 'pink', emoji: '🩷' },
      { id: 'brown', text: 'brown', emoji: '🤎' },
      { id: 'black', text: 'black', emoji: '⚫' },
      { id: 'white', text: 'white', emoji: '⚪' },
      { id: 'gray', text: 'gray', emoji: '🔘' },
      { id: 'rainbow', text: 'rainbow', emoji: '🌈' },
      { id: 'bright', text: 'bright', emoji: '✨' },
      { id: 'dark', text: 'dark', emoji: '🌑' },
      { id: 'light', text: 'light', emoji: '💡' },
      { id: 'colorful', text: 'colorful', emoji: '🎨' },
      { id: 'favorite', text: 'favorite color', emoji: '❤️' },
      { id: 'pretty', text: 'pretty', emoji: '😍' },
      { id: 'beautiful', text: 'beautiful', emoji: '🌸' },
      { id: 'shiny', text: 'shiny', emoji: '✨' }
    ]
  },
  abc: {
    name: '🔤 ABC',
    color: 'bg-violet-500',
    words: [
      { id: 'a', text: 'A', emoji: '🅰️' },
      { id: 'b', text: 'B', emoji: '🅱️' },
      { id: 'c', text: 'C', emoji: '🅲' },
      { id: 'd', text: 'D', emoji: '🅳' },
      { id: 'e', text: 'E', emoji: '🅴' },
      { id: 'f', text: 'F', emoji: '🅵' },
      { id: 'g', text: 'G', emoji: '🅶' },
      { id: 'h', text: 'H', emoji: '🅷' },
      { id: 'i', text: 'I', emoji: '🅸' },
      { id: 'j', text: 'J', emoji: '🅹' },
      { id: 'k', text: 'K', emoji: '🅺' },
      { id: 'l', text: 'L', emoji: '🅻' },
      { id: 'm', text: 'M', emoji: '🅼' },
      { id: 'n', text: 'N', emoji: '🅽' },
      { id: 'o', text: 'O', emoji: '🅾️' },
      { id: 'p', text: 'P', emoji: '🅿️' },
      { id: 'q', text: 'Q', emoji: '🆀' },
      { id: 'r', text: 'R', emoji: '🆁' },
      { id: 's', text: 'S', emoji: '🆂' },
      { id: 't', text: 'T', emoji: '🆃' },
      { id: 'u', text: 'U', emoji: '🆄' },
      { id: 'v', text: 'V', emoji: '🆅' },
      { id: 'w', text: 'W', emoji: '🆆' },
      { id: 'x', text: 'X', emoji: '🆇' },
      { id: 'y', text: 'Y', emoji: '🆈' },
      { id: 'z', text: 'Z', emoji: '🆉' }
    ]
  }
};

const LittlesAAC = () => {
  // State management
  const [currentCategory, setCurrentCategory] = useState('core');
  const [gridSize, setGridSize] = useState(4);
  const [messageBuilder, setMessageBuilder] = useState([]);
  const [settings, setSettings] = useState({
    holdDuration: 0,
    selectOnRelease: false,
    voiceRate: 1.0,
    voicePitch: 1.0,
    selectedVoice: null,
    gridSpacing: 4
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isHolding, setIsHolding] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const holdTimerRef = useRef(null);

  // Initialize voices
  useEffect(() => {
    const updateVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    updateVoices();
    speechSynthesis.addEventListener('voiceschanged', updateVoices);
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', updateVoices);
    };
  }, []);

  // Enhanced TTS with full customization
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = settings.voiceRate;
      utterance.pitch = settings.voicePitch;
      
      // Use selected voice or find best child voice
      if (settings.selectedVoice) {
        const voice = availableVoices.find(v => v.name === settings.selectedVoice);
        if (voice) utterance.voice = voice;
      } else {
        const childVoice = availableVoices.find(voice => 
          voice.name.toLowerCase().includes('child') || 
          voice.name.toLowerCase().includes('kid') ||
          voice.name.toLowerCase().includes('junior') ||
          voice.name.toLowerCase().includes('female')
        );
        if (childVoice) utterance.voice = childVoice;
      }
      
      speechSynthesis.speak(utterance);
    }
  };

  // Enhanced button interaction with touch accommodations
  const handleButtonPress = (word) => {
    if (settings.holdDuration > 0) {
      setIsHolding(word.id);
      holdTimerRef.current = setTimeout(() => {
        executeButtonAction(word);
        setIsHolding(null);
      }, settings.holdDuration * 1000);
    } else if (settings.selectOnRelease) {
      setIsHolding(word.id);
    } else {
      executeButtonAction(word);
    }
  };

  const handleButtonRelease = (word) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    
    if (settings.selectOnRelease && isHolding === word.id) {
      executeButtonAction(word);
    }
    
    setIsHolding(null);
  };

  const executeButtonAction = (word) => {
    // Add to message builder
    setMessageBuilder(prev => [...prev, word]);
    
    // Immediate word feedback
    speak(word.text);
  };

  // Message builder controls
  const speakMessage = () => {
    const message = messageBuilder.map(word => word.text).join(' ');
    if (message.trim()) {
      speak(message);
    }
  };

  const clearMessage = () => {
    setMessageBuilder([]);
  };

  const removeWord = (index) => {
    setMessageBuilder(prev => prev.filter((_, i) => i !== index));
  };

  // Get current vocabulary
  const getCurrentVocabulary = () => {
    return VOCABULARY[currentCategory]?.words || [];
  };

  // Category navigation
  const categories = Object.keys(VOCABULARY);
  const currentIndex = categories.indexOf(currentCategory);

  const goToPreviousCategory = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : categories.length - 1;
    setCurrentCategory(categories[newIndex]);
  };

  const goToNextCategory = () => {
    const newIndex = currentIndex < categories.length - 1 ? currentIndex + 1 : 0;
    setCurrentCategory(categories[newIndex]);
  };

  // Generate grid
  const generateGrid = () => {
    const vocabulary = getCurrentVocabulary();
    const totalCells = gridSize * gridSize;
    const grid = [];

    for (let i = 0; i < totalCells; i++) {
      const word = vocabulary[i];
      grid.push(
        <div
          key={i}
          className={`
            aspect-square border-2 rounded-xl flex flex-col items-center justify-center
            text-center p-2 transition-all duration-200 cursor-pointer select-none
            ${word ? 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-lg active:scale-95' : 'bg-gray-50 border-gray-200'}
            ${isHolding === word?.id ? 'bg-blue-100 border-blue-500 scale-95' : ''}
            ${settings.gridSpacing === 2 ? 'm-0.5' : settings.gridSpacing === 6 ? 'm-1.5' : 'm-1'}
          `}
          onMouseDown={() => word && handleButtonPress(word)}
          onMouseUp={() => word && handleButtonRelease(word)}
          onMouseLeave={() => word && handleButtonRelease(word)}
          onTouchStart={(e) => { e.preventDefault(); word && handleButtonPress(word); }}
          onTouchEnd={(e) => { e.preventDefault(); word && handleButtonRelease(word); }}
        >
          {word && (
            <>
              <div className="text-3xl mb-1">
                {word.emoji}
              </div>
              <div className="text-sm font-bold text-gray-800 leading-tight">
                {word.text}
              </div>
            </>
          )}
        </div>
      );
    }

    return grid;
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Volume2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Littles AAC</h1>
            <p className="text-sm text-gray-500">Tap → Hear → Be Understood</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* Message Builder */}
      <div className="bg-white border-b shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 min-h-[4rem] bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-300">
            {messageBuilder.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-lg">
                💬 Tap words to build your message...
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {messageBuilder.map((word, index) => (
                  <div
                    key={index}
                    className="bg-blue-500 text-white px-3 py-2 rounded-lg flex items-center space-x-2 shadow-md"
                  >
                    <span className="text-lg">{word.emoji}</span>
                    <span className="font-medium">{word.text}</span>
                    <button
                      onClick={() => removeWord(index)}
                      className="ml-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-col space-y-2">
            <button
              onClick={speakMessage}
              disabled={messageBuilder.length === 0}
              className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:bg-gray-300 flex items-center space-x-2 font-bold shadow-lg disabled:shadow-none transition-all"
            >
              <Play className="w-5 h-5" />
              <span>Speak</span>
            </button>
            <button
              onClick={clearMessage}
              disabled={messageBuilder.length === 0}
              className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:bg-gray-300 flex items-center space-x-2 shadow-lg disabled:shadow-none transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-yellow-50 border-b p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Grid Size</label>
              <select
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="w-full p-2 border-2 rounded-lg"
              >
                <option value={2}>2×2</option>
                <option value={3}>3×3</option>
                <option value={4}>4×4</option>
                <option value={5}>5×5</option>
                <option value={6}>6×6</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2">Voice</label>
              <select
                value={settings.selectedVoice || ''}
                onChange={(e) => setSettings(prev => ({...prev, selectedVoice: e.target.value || null}))}
                className="w-full p-2 border-2 rounded-lg"
              >
                <option value="">Auto (Child Voice)</option>
                {availableVoices.map((voice, index) => (
                  <option key={index} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2">Speed: {settings.voiceRate}x</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.voiceRate}
                onChange={(e) => setSettings(prev => ({...prev, voiceRate: Number(e.target.value)}))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2">Pitch: {settings.voicePitch}x</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.voicePitch}
                onChange={(e) => setSettings(prev => ({...prev, voicePitch: Number(e.target.value)}))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2">Hold Duration</label>
              <input
                type="number"
                min="0"
                max="3"
                step="0.1"
                value={settings.holdDuration}
                onChange={(e) => setSettings(prev => ({...prev, holdDuration: Number(e.target.value)}))}
                className="w-full p-2 border-2 rounded-lg"
                placeholder="0 = off"
              />
            </div>
          </div>
        </div>
      )}

      {/* Category Navigation */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={goToPreviousCategory}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 overflow-x-auto">
            <div className="flex space-x-2">
              {Object.entries(VOCABULARY).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => setCurrentCategory(key)}
                  className={`
                    px-4 py-2 rounded-xl whitespace-nowrap font-bold transition-all shadow-md
                    ${currentCategory === key 
                      ? `${category.color} text-white shadow-lg scale-105` 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={goToNextCategory}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Word Grid */}
      <div className="flex-1 p-4 overflow-auto">
        <div 
          className="grid gap-2 h-full"
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`
          }}
        >
          {generateGrid()}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 text-white p-3 text-sm flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="font-bold">{VOCABULARY[currentCategory]?.name}</span>
          <span>Grid: {gridSize}×{gridSize}</span>
          <span>Words: {getCurrentVocabulary().length}</span>
        </div>
        <div className="flex items-center space-x-4">
          {settings.holdDuration > 0 && (
            <span className="bg-yellow-600 px-2 py-1 rounded">Hold: {settings.holdDuration}s</span>
          )}
          {settings.selectOnRelease && (
            <span className="bg-blue-600 px-2 py-1 rounded">Release Mode</span>
          )}
          <span className="bg-green-600 px-2 py-1 rounded">🌐 Offline Ready</span>
        </div>
      </div>
    </div>
  );
};

export default LittlesAAC;
