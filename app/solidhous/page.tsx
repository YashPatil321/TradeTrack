"use client";
import React, { useState } from 'react';

interface CabinetRow {
  id: number;
  qty: number;
  doorStyle: string;
  component: string;
  width: string;
  height: string;
  depth: string;
  feature: string;
  endPanel: string;
}

interface DrawerRow {
  id: number;
  qty: number;
  component: string;
  innerWidth: string;
  innerHeight: string;
  innerDepth: string;
  feature: string;
  description: string;
}

export default function RemodelFormPage() {
  const [cabinetRows, setCabinetRows] = useState<CabinetRow[]>([
    { id: Date.now(), qty: 1, doorStyle: '', component: '', width: '', height: '', depth: '', feature: '', endPanel: '' }
  ]);
  const [drawerRows, setDrawerRows] = useState<DrawerRow[]>([
    { id: Date.now() + 1, qty: 1, component: '', innerWidth: '', innerHeight: '', innerDepth: '', feature: '', description: '' }
  ]);

  // Cabinet handlers
  const addCabinetRow = () => setCabinetRows([
    ...cabinetRows,
    { id: Date.now(), qty: 1, doorStyle: '', component: '', width: '', height: '', depth: '', feature: '', endPanel: '' }
  ]);

  const removeCabinetRow = (id: number) => setCabinetRows(cabinetRows.filter(row => row.id !== id));
  const handleCabinetChange = (id: number, field: keyof CabinetRow, value: any) => {
    setCabinetRows(cabinetRows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  // Drawer handlers
  const addDrawerRow = () => setDrawerRows([
    ...drawerRows,
    { id: Date.now(), qty: 1, component: '', innerWidth: '', innerHeight: '', innerDepth: '', feature: '', description: '' }
  ]);

  const removeDrawerRow = (id: number) => setDrawerRows(drawerRows.filter(row => row.id !== id));
  const handleDrawerChange = (id: number, field: keyof DrawerRow, value: any) => {
    setDrawerRows(drawerRows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Remodel Form</h1>

        <form className="space-y-8">
          {/* General Info */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">General Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/** Company **/}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Company</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Company</option>
                </select>
              </div>
              {/** Sales Person **/}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Sales Person</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Sales Person</option>
                </select>
              </div>
              {/** Customer Name **/}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Customer Name</label>
                <input
                  type="text"
                  placeholder="Enter your Name"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/** Project **/}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Project</label>
                <input
                  type="text"
                  placeholder="Enter your project"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/** Drawer Box Material **/}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Drawer Box Material</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>12mm Baltic Birch Dovetail</option>
                </select>
              </div>
              {/** Variance Threshold **/}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Variance Threshold</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="minimum height..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/** Edge Banding **/}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Edge Banding</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Color of Edgebanding</option>
                </select>
              </div>
              {/** Wall/All Cabinet Top Reveal **/}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Wall/All Cabinet Top Reveal</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.125"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/** Railout Configuration **/}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Railout Configuration</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Zero Protusion Hinge</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cabinet Configuration */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Cabinet Configuration</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {['No','Qty','Door Style','Component','Width','Height','Depth','Feature','End Panel','Action'].map(header => (
                      <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cabinetRows.map((row, i) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-700">{i+1}</td>
                      <td className="px-4 py-2"><input type="number" value={row.qty} onChange={e => handleCabinetChange(row.id,'qty',parseInt(e.target.value))} className="w-16 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"/></td>
                      <td className="px-4 py-2"><select value={row.doorStyle} onChange={e=>handleCabinetChange(row.id,'doorStyle',e.target.value)} className="w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Select</option></select></td>
                      <td className="px-4 py-2"><select value={row.component} onChange={e=>handleCabinetChange(row.id,'component',e.target.value)} className="w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Base Cabinet 1 Door</option></select></td>
                      <td className="px-4 py-2"><input type="text" value={row.width} onChange={e=>handleCabinetChange(row.id,'width',e.target.value)} className="w-20 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"/></td>
                      <td className="px-4 py-2"><input type="text" value={row.height} onChange={e=>handleCabinetChange(row.id,'height',e.target.value)} className="w-20 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"/></td>
                      <td className="px-4 py-2"><input type="text" value={row.depth} onChange={e=>handleCabinetChange(row.id,'depth',e.target.value)} className="w-20 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"/></td>
                      <td className="px-4 py-2"><input type="text" value={row.feature} onChange={e=>handleCabinetChange(row.id,'feature',e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"/></td>
                      <td className="px-4 py-2"><select value={row.endPanel} onChange={e=>handleCabinetChange(row.id,'endPanel',e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">None</option></select></td>
                      <td className="px-4 py-2 text-sm text-red-500 hover:text-red-700 cursor-pointer" onClick={()=>removeCabinetRow(row.id)}>Delete</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={addCabinetRow} className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              Insert Record
            </button>
          </div>

          {/* Drawers & Accessories Configuration */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Drawers & Accessories Configuration</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {['No','Qty','Component','Inner Width','Inner Height','Inner Depth','Feature','Description','Action'].map(header => (
                      <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {drawerRows.map((row,i)=>(
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-700">{i+1}</td>
                      <td className="px-4 py-2"><input type="number" value={row.qty} onChange={e=>handleDrawerChange(row.id,'qty',parseInt(e.target.value))} className="w-16 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"/></td>
                      <td className="px-4 py-2"><select value={row.component} onChange={e=>handleDrawerChange(row.id,'component',e.target.value)} className="w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Drawer Box</option></select></td>
                      <td className="px-4 py-2"><input type="text" value={row.innerWidth} onChange={e=>handleDrawerChange(row.id,'innerWidth',e.target.value)} className="w-20 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"/></td>
                      <td className="px-4 py-2"><input type="text" value={row.innerHeight} onChange={e=>handleDrawerChange(row.id,'innerHeight',e.target.value)} className="w-20 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"/></td>
                      <td className="px-4 py-2"><input type="text" value={row.innerDepth} onChange={e=>handleDrawerChange(row.id,'innerDepth',e.target.value)} className="w-20 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"/></td>
                      <td className="px-4 py-2"><input type="text" value={row.feature} onChange={e=>handleDrawerChange(row.id,'feature',e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"/></td>
                      <td className="px-4 py-2"><input type="text" value={row.description} onChange={e=>handleDrawerChange(row.id,'description',e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"/></td>
                      <td className="px-4 py-2 text-sm text-red-500 hover:text-red-700 cursor-pointer" onClick={()=>removeDrawerRow(row.id)}>Delete</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={addDrawerRow} className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              Insert Record
            </button>
          </div>

          {/* Next sections... */}
        </form>
      </div>
    </div>
  );
}
