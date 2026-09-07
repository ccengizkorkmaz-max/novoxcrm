'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { MessageCircle } from 'lucide-react'

export default function CrmWhatsAppRealtimeNotifier({
    tenantId
}: {
    tenantId?: string
}) {
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const channel = supabase
            .channel('realtime-inbound-whatsapp')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'whatsapp_messages',
                    filter: 'direction=eq.inbound'
                },
                async (payload) => {
                    const newMsg = payload.new
                    if (!newMsg || newMsg.direction !== 'inbound') return

                    try {
                        // Konuşma ve müşteri bilgilerini sorgula
                        const { data: conv } = await supabase
                            .from('whatsapp_conversations')
                            .select('id, phone_number, customer_id, tenant_id')
                            .eq('id', newMsg.conversation_id)
                            .maybeSingle()

                        // Eğer tenantId uyuşmuyorsa gösterme
                        if (tenantId && conv?.tenant_id && conv.tenant_id !== tenantId) {
                            return
                        }

                        let customerName = conv?.phone_number || 'Müşteri'
                        let customerData: any = {
                            id: conv?.customer_id,
                            phone: conv?.phone_number,
                            full_name: customerName
                        }

                        if (conv?.customer_id) {
                            const { data: cust } = await supabase
                                .from('customers')
                                .select('id, full_name, phone')
                                .eq('id', conv.customer_id)
                                .maybeSingle()

                            if (cust) {
                                customerName = cust.full_name || customerName
                                customerData = cust
                            }
                        }

                        // Listeyi ve sayaçları yenile
                        router.refresh()

                        // Üst Bar için Canlı Mesaj Bilgisi Yayınla ve Sakla
                        const bannerPayload = {
                            customerName,
                            content: newMsg.content || 'Yeni mesaj geldi',
                            phone: customerData.phone,
                            customerData,
                            at: new Date().toISOString()
                        }
                        try {
                            localStorage.setItem('crm_last_inbound_wp', JSON.stringify(bannerPayload))
                        } catch {}
                        window.dispatchEvent(new CustomEvent('new-inbound-whatsapp-banner', { detail: bannerPayload }))

                        // Canlı Toast bildirimi (Temsilci görene/yanıtlayana kadar ekranda kalır)
                        toast(
                            `💬 Yeni WhatsApp Mesajı: ${customerName}`,
                            {
                                description: newMsg.content ? `"${newMsg.content.substring(0, 90)}"` : 'Müşteriden yeni bir mesaj geldi',
                                icon: <MessageCircle className="h-4 w-4 text-emerald-500 animate-pulse" />,
                                duration: Infinity,
                                cancel: {
                                    label: 'Kapat',
                                    onClick: () => {}
                                },
                                action: {
                                    label: 'Yanıtla',
                                    onClick: () => {
                                        window.dispatchEvent(new CustomEvent('open-crm-whatsapp-chat', {
                                            detail: {
                                                customer: customerData,
                                                saleId: null
                                            }
                                        }))
                                    }
                                }
                            }
                        )
                    } catch (err) {
                        console.error('[Realtime WA Notifier error]:', err)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, tenantId, router])

    return null
}
