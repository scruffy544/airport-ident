'use client';
import { useState, useRef } from 'react';

const SHOP_ID = '27346744';
const BLUEPRINT_ID = 600;
const PROVIDER_ID = 73;
const VARIANTS = [
  { id: 72006, size: '2"x2"', price: 1099 },
  { id: 72007, size: '3"x3"', price: 1199 },
  { id: 72008, size: '4"x4"', price: 1299 },
  { id: 72009, size: '5"x5"', price: 1399 },
  { id: 72010, size: '6"x6"', price: 1499 }
];

const AIRPORTS = {"BGM":{"code":"BGM","name":"Greater Binghamton/Edwin A Link field","city":"Binghamton","state":"NY"},"BNA":{"code":"BNA","name":"Nashville International Airport","city":"Nashville","state":"TN"},"BQK":{"code":"BQK","name":"Brunswick Golden Isles Airport","city":"Brunswick","state":"GA"}};

export default function PrintifyUploader() {
  const [token, setToken] = useState('');
  const [file, setFile] = useState(null);
  const [airport, setAirport] = useState(null);
  const [preview, setPreview] = useState(null);
  const [log, setLog] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef();

  const addLog = (msg, type='info') => setLog(l => [...l, {msg, type, time: new Date().toLocaleTimeString()}]);

  const handleFile = (f) => {
    if (!f || !f.name.endsWith('.png')) { alert('Please select a PNG file.'); return; }
    setFile(f);
    setDone(false);
    setLog([]);
    const code = f.name.split('-')[0].toUpperCase();
    const ap = AIRPORTS[code];
    setAirport(ap || null);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const generateTitle = (ap) =>
    `${ap.name} (${ap.code}) - ${ap.city}, ${ap.state} - Airport Code Oval Die-Cut Sticker/Luggage/Automobile Decal`;

  const startUpload = async () => {
    if (!token) { alert('Enter your API token.'); return; }
    if (!file || !airport) { alert('Load a valid PNG first.'); return; }
