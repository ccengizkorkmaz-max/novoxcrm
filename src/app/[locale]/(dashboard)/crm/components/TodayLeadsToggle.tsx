"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';

export default function TodayLeadsToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('CRM');
  const isChecked = searchParams.get('tl') === '1';

  const toggle = () => {
    const params = new URLSearchParams(searchParams as any);
    if (isChecked) {
      params.delete('tl');
    } else {
      params.set('tl', '1');
    }
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center space-x-2 ml-4">
      <Checkbox id="only-today-leads" checked={isChecked} onCheckedChange={toggle} />
      <Label htmlFor="only-today-leads" className="cursor-pointer text-sm font-medium text-slate-700">
        {t('filters.onlyTodayLeads') || 'Bugün Lead'}
      </Label>
    </div>
  );
}

