'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Printer, Save, FileText, Users, Receipt, LayoutDashboard, TrendingUp, DollarSign, Clock, CheckCircle2, Mail, Send, Loader2 } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  date: string;
  dueDate: string;
  items: LineItem[];
  status: 'Draft' | 'Unpaid' | 'Paid';
  taxRate: number;
}

export default function EmailDeliveryBillingSystem() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'clients'>('invoices');
  
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '' });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const savedClients = localStorage.getItem('billing_clients');
    const savedInvoices = localStorage.getItem('billing_invoices');

    if (savedClients) {
      try { setClients(JSON.parse(savedClients)); } catch (e) { console.error(e); }
    } else {
      const initialClient = { id: '1', name: 'Acme Corporation', email: 'billing@acme.com', phone: '555-0192', address: '123 Business Rd' };
      setClients([initialClient]);
      localStorage.setItem('billing_clients', JSON.stringify([initialClient]));
    }

    if (savedInvoices) {
      try {
        const parsed = JSON.parse(savedInvoices);
        setInvoices(parsed);
        if (parsed.length > 0) setSelectedInvoice(parsed[0]);
      } catch (e) { console.error(e); }
    } else {
      handleCreateNew(savedClients ? JSON.parse(savedClients) : []);
    }
  }, []);

  const saveClientsToStorage = (updated: Client[]) => {
    setClients(updated);
    localStorage.setItem('billing_clients', JSON.stringify(updated));
  };

  const saveInvoicesToStorage = (updated: Invoice[]) => {
    setInvoices(updated);
    localStorage.setItem('billing_invoices', JSON.stringify(updated));
  };

  const calculateInvoiceTotal = (inv: Invoice) => {
    const sub = inv.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = (sub * inv.taxRate) / 100;
    return sub + tax;
  };

  const metrics = useMemo(() => {
    let totalRevenue = 0, paidRevenue = 0, pendingRevenue = 0, paidCount = 0, unpaidCount = 0;
    invoices.forEach((inv) => {
      const total = calculateInvoiceTotal(inv);
      totalRevenue += total;
      if (inv.status === 'Paid') { paidRevenue += total; paidCount++; }
      else if (inv.status === 'Unpaid') { pendingRevenue += total; unpaidCount++; }
    });
    return { totalRevenue, paidRevenue, pendingRevenue, paidCount, unpaidCount, totalInvoices: invoices.length };
  }, [invoices]);

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name) return;
    const client: Client = { id: Date.now().toString(), ...newClient };
    saveClientsToStorage([...clients, client]);
    setNewClient({ name: '', email: '', phone: '', address: '' });
  };

  const handleDeleteClient = (id: string) => saveClientsToStorage(clients.filter((c) => c.id !== id));

  const handleCreateNew = (clientList = clients) => {
    const defaultClient = clientList[0];
    const newInvoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      clientId: defaultClient ? defaultClient.id : '',
      clientName: defaultClient ? defaultClient.name : '',
      clientEmail: defaultClient ? defaultClient.email : '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ id: Date.now().toString(), description: 'Software Engineering Services', quantity: 1, unitPrice: 250 }],
      status: 'Draft',
      taxRate: 10,
    };
    setSelectedInvoice(newInvoice);
  };

  const updateInvoiceField = (field: keyof Invoice, value: any) => {
    if (!selectedInvoice) return;
    setSelectedInvoice({ ...selectedInvoice, [field]: value });
  };

  const handleClientSelectChange = (clientId: string) => {
    if (!selectedInvoice) return;
    const foundClient = clients.find((c) => c.id === clientId);
    if (foundClient) {
      setSelectedInvoice({
        ...selectedInvoice,
        clientId: foundClient.id,
        clientName: foundClient.name,
        clientEmail: foundClient.email,
      });
    }
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    if (!selectedInvoice) return;
    const updatedItems = selectedInvoice.items.map((item) => item.id === id ? { ...item, [field]: value } : item);
    setSelectedInvoice({ ...selectedInvoice, items: updatedItems });
  };

  const addItem = () => {
    if (!selectedInvoice) return;
    const newItem: LineItem = { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 };
    setSelectedInvoice({ ...selectedInvoice, items: [...selectedInvoice.items, newItem] });
  };

  const removeItem = (id: string) => {
    if (!selectedInvoice || selectedInvoice.items.length <= 1) return;
    setSelectedInvoice({ ...selectedInvoice, items: selectedInvoice.items.filter((item) => item.id !== id) });
  };

  const subtotal = useMemo(() => selectedInvoice ? selectedInvoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) : 0, [selectedInvoice?.items]);
  const tax = useMemo(() => (subtotal * (selectedInvoice?.taxRate || 0)) / 100, [subtotal, selectedInvoice?.taxRate]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const handleSaveInvoice = () => {
    if (!selectedInvoice) return;
    const existingIndex = invoices.findIndex((i) => i.id === selectedInvoice.id);
    let updated: Invoice[];
    if (existingIndex >= 0) { updated = [...invoices]; updated[existingIndex] = selectedInvoice; }
    else { updated = [selectedInvoice, ...invoices]; }
    saveInvoicesToStorage(updated);
    alert('Invoice saved successfully!');
  };

  // Safe Email Trigger with text/JSON fallback parser
  const handleSendEmail = async () => {
    if (!selectedInvoice || !selectedInvoice.clientEmail) {
      alert('Please select or specify a valid client email address.');
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: selectedInvoice.invoiceNumber,
          clientName: selectedInvoice.clientName,
          clientEmail: selectedInvoice.clientEmail,
          dueDate: selectedInvoice.dueDate,
          total,
          items: selectedInvoice.items,
        }),
      });

      const text = await response.text();
      let resData;
      try {
        resData = JSON.parse(text);
      } catch (e) {
        throw new Error(`Server returned status ${response.status} (Not a valid JSON response). Ensure route.ts exists under src/app/api/send-invoice/route.ts`);
      }

      if (response.ok) {
        alert(`Invoice emailed successfully to ${selectedInvoice.clientEmail}!`);
      } else {
        alert(`Email Notice: ${resData.error || 'Server processed request.'}`);
      }
    } catch (err: any) {
      alert(`Error sending email: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 md:p-8">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; color: black; }
          .print-area { box-shadow: none !important; border: none !important; margin: 0; padding: 0; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-6">
        <header className="no-print flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold">Billing & Email Service</h1>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg text-sm">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition ${
                  activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition ${
                  activeTab === 'invoices' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-4 h-4" /> Invoices
              </button>
              <button
                onClick={() => setActiveTab('clients')}
                className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition ${
                  activeTab === 'clients' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" /> Clients ({clients.length})
              </button>
            </div>
          </div>

          {activeTab === 'invoices' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleCreateNew()}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5 text-sm font-medium transition"
              >
                <Plus className="w-4 h-4" /> New
              </button>
              <button
                onClick={handleSaveInvoice}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 text-sm font-medium transition"
              >
                <Save className="w-4 h-4" /> Save
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSending}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 text-sm font-medium transition disabled:opacity-50"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSending ? 'Sending...' : 'Send Email'}
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 text-sm font-medium transition"
              >
                <Printer className="w-4 h-4" /> Print / PDF
              </button>
            </div>
          )}
        </header>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border space-y-2">
                <span className="text-xs font-semibold uppercase text-slate-400">Total Revenue</span>
                <div className="text-2xl font-extrabold text-slate-800">${metrics.totalRevenue.toFixed(2)}</div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border space-y-2">
                <span className="text-xs font-semibold uppercase text-slate-400">Collected</span>
                <div className="text-2xl font-extrabold text-emerald-600">${metrics.paidRevenue.toFixed(2)}</div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border space-y-2">
                <span className="text-xs font-semibold uppercase text-slate-400">Pending</span>
                <div className="text-2xl font-extrabold text-amber-600">${metrics.pendingRevenue.toFixed(2)}</div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border space-y-2">
                <span className="text-xs font-semibold uppercase text-slate-400">Total Clients</span>
                <div className="text-2xl font-extrabold text-slate-800">{clients.length}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLIENTS */}
        {activeTab === 'clients' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm space-y-4 md:col-span-1">
              <h2 className="font-semibold text-slate-700">Add New Client</h2>
              <form onSubmit={handleAddClient} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Company / Client Name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="w-full text-sm border rounded-lg p-2 outline-none"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className="w-full text-sm border rounded-lg p-2 outline-none"
                />
                <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Save Client</button>
              </form>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm md:col-span-2 space-y-4">
              <h2 className="font-semibold text-slate-700">Client Directory</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {clients.map((c) => (
                  <div key={c.id} className="border rounded-xl p-4 relative">
                    <h3 className="font-bold">{c.name}</h3>
                    <p className="text-xs text-slate-500">{c.email}</p>
                    <button onClick={() => handleDeleteClient(c.id)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INVOICE GENERATOR WITH SEND EMAIL */}
        {activeTab === 'invoices' && selectedInvoice && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <aside className="no-print bg-white p-4 rounded-xl shadow-sm lg:col-span-1 space-y-3">
              <h2 className="font-semibold text-slate-600 text-sm tracking-wider uppercase">Saved Invoices</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className={`p-3 rounded-lg border cursor-pointer transition ${selectedInvoice.id === inv.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                  >
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span>{inv.invoiceNumber}</span>
                      <span className="text-xs">{inv.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{inv.clientName || 'Unnamed'}</p>
                  </div>
                ))}
              </div>
            </aside>

            <main className="print-area bg-white p-8 rounded-xl shadow-sm lg:col-span-3 space-y-8">
              <div className="flex flex-col md:flex-row justify-between gap-6 border-b pb-6">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-800">INVOICE</h2>
                  <input
                    type="text"
                    value={selectedInvoice.invoiceNumber}
                    onChange={(e) => updateInvoiceField('invoiceNumber', e.target.value)}
                    className="font-mono border-b border-dashed border-slate-300 outline-none text-slate-600 mt-1"
                  />
                </div>

                <div className="flex flex-col gap-2 text-sm md:text-right">
                  <select
                    value={selectedInvoice.status}
                    onChange={(e) => updateInvoiceField('status', e.target.value)}
                    className="p-1 border rounded text-sm bg-slate-50 no-print"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center no-print">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase">Billed To</h3>
                  <select
                    value={selectedInvoice.clientId}
                    onChange={(e) => handleClientSelectChange(e.target.value)}
                    className="text-xs border rounded p-1 bg-slate-50"
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Client Name"
                    value={selectedInvoice.clientName}
                    onChange={(e) => updateInvoiceField('clientName', e.target.value)}
                    className="w-full font-medium border-b outline-none pb-1"
                  />
                  <input
                    type="email"
                    placeholder="Client Email"
                    value={selectedInvoice.clientEmail}
                    onChange={(e) => updateInvoiceField('clientEmail', e.target.value)}
                    className="w-full text-sm border-b outline-none pb-1"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-xs text-slate-400 uppercase">
                      <th className="py-2">Description</th>
                      <th className="py-2 w-20 text-center">Qty</th>
                      <th className="py-2 w-28 text-right">Price</th>
                      <th className="py-2 w-28 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {selectedInvoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            className="w-full border-b border-transparent hover:border-slate-200 outline-none"
                          />
                        </td>
                        <td className="py-3 text-center">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                            className="w-16 text-center border rounded p-1"
                          />
                        </td>
                        <td className="py-3 text-right">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                            className="w-24 text-right border rounded p-1"
                          />
                        </td>
                        <td className="py-3 text-right font-medium">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end border-t pt-6">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between font-bold text-lg text-slate-800">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}