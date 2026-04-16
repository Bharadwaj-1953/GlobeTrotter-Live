'use client'
import { use } from 'react'
import { redirect } from 'next/navigation'
export default function S({ params }: { params: Promise<{ id: string }> }) { redirect('/home'); return null }
