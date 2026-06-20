console.log('1. Testing require("express")...');
const express = require('express');
console.log('2. express loaded');

console.log('3. Testing require("cors")...');
const cors = require('cors');
console.log('4. cors loaded');

console.log('5. Testing require("path")...');
const path = require('path');
console.log('6. path loaded');

console.log('7. Done');
process.exit(0);
