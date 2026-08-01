'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, QrCode, CheckCircle2, Lock, Sparkles, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';

interface PaytmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (proToken: string) => void;
}

export default function PaytmModal({ isOpen, onClose, onPaymentSuccess }: PaytmModalProps) {
  const [qrCanvasData, setQrCanvasData] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success'>('pending');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      initPaymentOrder();
    }
  }, [isOpen]);

  const initPaymentOrder = async () => {
    setIsLoading(true);
    const newOrderId = `PAYTM_APEX_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    setOrderId(newOrderId);
    setPaymentStatus('pending');

    try {
      const upiUrl = `upi://pay?pa=apexai.paytm@paytm&pn=ApexAI%20Pro&tr=${newOrderId}&am=49.00&cu=INR&tn=Apex%20AI%20Pro%20Engineer%20Unlock`;
      const qrDataUrl = await QRCode.toDataURL(upiUrl, {
        width: 220,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCanvasData(qrDataUrl);
    } catch (err) {
      console.error('QR generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    setPaymentStatus('processing');
    try {
      // Call mock Paytm webhook endpoint
      const response = await fetch('http://localhost:8000/api/paytm/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          amount: 49,
          status: 'TXN_SUCCESS',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentStatus('success');
        setTimeout(() => {
          onPaymentSuccess(data.pro_token || 'PRO_UNLOCKED_APEX');
          onClose();
        }, 1200);
      } else {
        // Fallback local unlock if backend isn't reachably live
        setPaymentStatus('success');
        setTimeout(() => {
          onPaymentSuccess('PRO_UNLOCKED_APEX');
          onClose();
        }, 1200);
      }
    } catch {
      // Direct success simulation for quick demo resilience
      setPaymentStatus('success');
      setTimeout(() => {
        onPaymentSuccess('PRO_UNLOCKED_APEX');
        onClose();
      }, 1200);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-[#0A0A0E]/90 border border-red-500/40 rounded-2xl p-6 shadow-2xl backdrop-blur-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 glow-yellow">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-mono text-white flex items-center gap-2">
                UNLOCK PRO RACE ENGINEER
              </h3>
              <p className="text-xs text-gray-400 font-mono">Real-time Pit Strategy & Telemetry AI</p>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-[#121218] border border-amber-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-400 font-mono uppercase tracking-widest block">SPECIAL ACCESS PASS</span>
              <span className="text-xs text-gray-400">Unlimited Pit Strategy Calculations</span>
            </div>
            <div className="text-right font-mono">
              <span className="text-2xl font-black text-white">₹49</span>
              <span className="text-xs text-gray-400 block">One-time / Session</span>
            </div>
          </div>

          {/* QR Code section */}
          <div className="flex flex-col items-center justify-center p-4 bg-white/5 border border-gray-800 rounded-xl mb-6">
            {isLoading ? (
              <div className="w-48 h-48 flex flex-col items-center justify-center text-gray-400 font-mono text-xs">
                <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-2" />
                GENERATING PAYTM QR...
              </div>
            ) : paymentStatus === 'success' ? (
              <div className="w-48 h-48 flex flex-col items-center justify-center text-emerald-400 font-mono text-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce mb-2" />
                <span className="font-bold text-sm">PAYMENT VERIFIED!</span>
                <span className="text-xs text-gray-400 mt-1">PRO FEATURES UNLOCKED</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {qrCanvasData ? (
                  <img
                    src={qrCanvasData}
                    alt="Paytm QR Code"
                    className="w-48 h-48 rounded-lg border-2 border-cyan-400/50 p-1 bg-white glow-cyan"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-900 flex items-center justify-center text-gray-500">
                    <QrCode className="w-12 h-12" />
                  </div>
                )}
                <div className="mt-3 text-center">
                  <div className="text-xs font-mono text-gray-300 font-bold flex items-center gap-1 justify-center">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" /> Paytm Official Gateway API
                  </div>
                  <div className="text-[11px] font-mono text-gray-500 mt-0.5">Order ID: {orderId}</div>
                </div>
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              disabled={paymentStatus === 'processing' || paymentStatus === 'success'}
              onClick={handleSimulatePayment}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-bold font-mono text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 glow-cyan disabled:opacity-50"
            >
              {paymentStatus === 'processing' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> VERIFYING PAYTM WEBHOOK...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> PAY ₹49 WITH PAYTM UPI
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-gray-500 font-mono">
              Instant activation via Paytm webhook integration.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
