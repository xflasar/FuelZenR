'use client';
import { useState } from 'react';

export default function ReceiptUpload() {
  const [loading, setLoading] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '/fuelzenr/api';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    await fetch(`${API_URL}/receipts`, {
      method: 'POST',
      body: formData,
    });
    setLoading(false);
    alert('Receipt saved');
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Add Receipt</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="file" 
          name="file" 
          accept="image/*" 
          capture="environment" 
          className="w-full border p-2"
        />
        <input name="stationName" placeholder="Station Name" className="w-full border p-2" required />
        <input name="amount" type="number" step="0.01" placeholder="Total Amount" className="w-full border p-2" required />
        <select name="fuelType" className="w-full border p-2">
          <option value="95">Petrol 95</option>
          <option value="98">Petrol 98</option>
          <option value="Diesel">Diesel</option>
        </select>
        <button 
          disabled={loading} 
          className="w-full bg-blue-600 text-white p-2 rounded disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : 'Save Receipt'}
        </button>
      </form>
    </div>
  );
}