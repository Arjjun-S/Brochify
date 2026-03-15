"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface PageOneProps {
  data: any;
  onEdit?: (path: string, value: any) => void;
}

export default function PageOne({ data, onEdit }: PageOneProps) {
  return (
    <div id="brochure-page-1" className="brochure-page border border-gray-200">
      {/* Column 1: Committees (White) */}
      <div className="column column-white border-r">
        <h3 className="bg-primary text-white px-2 py-1 text-xs font-bold rounded inline-block mb-4">
          ADVISORY COMMITTEE
        </h3>
        <ul className="text-[10px] space-y-1 mb-6">
          {data.committee?.filter((c: any) => c.role.includes('Advisory'))?.map((c: any, i: number) => (
            <li key={i}><strong>{c.name}</strong>, {c.role}</li>
          ))}
        </ul>

        <h3 className="bg-primary text-white px-2 py-1 text-xs font-bold rounded inline-block mb-4">
          ORGANIZING COMMITTEE
        </h3>
        <ul className="text-[10px] space-y-1">
          {data.committee?.filter((c: any) => !c.role.includes('Advisory'))?.map((c: any, i: number) => (
            <li key={i}><strong>{c.name}</strong>, {c.role}</li>
          ))}
        </ul>
      </div>

      {/* Column 2: Registration (Blue) */}
      <div className="column column-blue flex flex-col items-center text-center">
        <h2 className="text-xl font-bold bg-white text-primary px-4 py-2 rounded-full mb-8">
          REGISTRATION DETAIL
        </h2>
        
        <div className="bg-white/10 p-4 rounded-lg w-full text-left mb-6">
          <p className="font-bold mb-2">Registration Fee:</p>
          <div className="flex justify-between">
            <span>IEEE Member</span>
            <span>: Rs. {data.registration?.ieeePrice}/-</span>
          </div>
          <div className="flex justify-between">
            <span>Non IEEE Member</span>
            <span>: Rs. {data.registration?.nonIeeePrice}/-</span>
          </div>
          <p className="text-[9px] mt-2 italic text-blue-200">
            *Rs. 250 refundable upon IEEE Membership enrollment
          </p>
        </div>

        <p className="font-bold text-yellow-300 mb-4">
          Last date for registration: {data.registration?.deadline}
        </p>

        <div className="bg-white p-4 rounded-lg mb-4 flex items-center justify-center">
          <QRCodeSVG value={data.googleForm || ""} size={100} />
        </div>
        
        <p className="text-xs break-all px-2 overflow-hidden max-h-12">
          {data.googleForm}
        </p>

        <div className="mt-auto pt-4 border-t border-white/20 w-full">
            <h4 className="bg-white text-primary text-[10px] font-bold py-1 px-4 rounded-full inline-block mb-2">ACCOUNT DETAIL</h4>
            <div className="text-[9px] text-left">
                <p>Bank: Indian Bank</p>
                <p>Acc No: 7111751848</p>
                <p>IFSC: IDIB000S181</p>
            </div>
        </div>
      </div>

      {/* Column 3: Event Details (White) */}
      <div className="column column-white flex flex-col items-center">
        <div className="flex justify-between w-full mb-8">
            {/* Logos Placeholder */}
            <div className="w-12 h-12 bg-gray-100 rounded"></div>
            <div className="w-24 h-12 bg-gray-100 rounded"></div>
            <div className="w-12 h-12 bg-gray-100 rounded"></div>
        </div>

        <h1 className="text-2xl font-black text-center text-gray-800 leading-tight mb-4 uppercase">
            {data.eventTitle}
        </h1>

        <div className="text-center mb-8">
            <p className="text-lg font-bold text-primary">{data.dates}</p>
        </div>

        {data.eventImage && (
            <img src={data.eventImage} alt="Event AI" className="w-full h-48 object-cover rounded-xl shadow-lg mb-8" />
        )}

        <div className="mt-auto text-center">
            <p className="text-xs font-bold">Organized by</p>
            <p className="text-sm font-black text-primary uppercase">{data.department}</p>
        </div>
      </div>
    </div>
  );
}
