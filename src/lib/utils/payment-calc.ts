/**
 * Shared utility for interest-aware payment calculation (Vade Farkı)
 */

export interface PaymentScheduleItem {
    description: string;
    payment_type: 'DownPayment' | 'Installment' | 'Balloon' | 'DeliveryPayment' | 'Other' | 'InterimPayment';
    amount: number;
    due_date: string;
    currency: string;
    notes?: string;
}

export interface CalcParams {
    principal: number;
    downPaymentAmount: number;
    monthlyInterestRate: number; // e.g. 1.5 for 1.5%
    installmentCount: number;
    startDate: string;
    currency: string;
    interimPayments?: { month: number; amount: number }[];
}

export interface CalcResult {
    items: PaymentScheduleItem[];
    totalInterest: number;
    grandTotal: number;
    principalAfterDown: number;
}

export function calculatePaymentSchedule(params: CalcParams): CalcResult {
    const {
        principal,
        downPaymentAmount,
        monthlyInterestRate,
        installmentCount,
        startDate,
        currency,
        interimPayments = []
    } = params;

    const items: PaymentScheduleItem[] = [];
    const principalAfterDown = Math.max(0, principal - downPaymentAmount);

    // Total interim amount
    const totalInterim = interimPayments.reduce((sum, p) => sum + p.amount, 0);

    // The amount to be divided into installments
    const principalForInstallments = Math.max(0, principalAfterDown - totalInterim);

    // Interest Calculation: Simple Interest based on installments
    // Total Interest = PrincipalInInstallments * (MonthlyRate/100) * MonthCount
    const totalInterest = installmentCount > 0
        ? principalForInstallments * (monthlyInterestRate / 100) * installmentCount
        : 0;

    const grandTotal = principal + totalInterest;

    // Add Down Payment item
    items.push({
        description: 'Peşinat',
        payment_type: 'DownPayment',
        amount: downPaymentAmount,
        due_date: startDate,
        currency: currency,
        notes: 'Peşinat'
    });

    // Calculate monthly payment including interest portion
    // Each installment = (PrincipalPortion + InterestPortion)
    const monthlyPayment = installmentCount > 0
        ? (principalForInstallments + totalInterest) / installmentCount
        : 0;

    let currentDate = new Date(startDate);

    for (let i = 1; i <= installmentCount; i++) {
        currentDate = new Date(currentDate);
        currentDate.setMonth(currentDate.getMonth() + 1);
        const dateStr = currentDate.toISOString().split('T')[0];

        // Add Installment
        items.push({
            description: `${i}. Taksit`,
            payment_type: 'Installment',
            amount: Number(monthlyPayment.toFixed(2)),
            due_date: dateStr,
            currency: currency,
            notes: monthlyInterestRate > 0 ? `Vade farkı dahil` : undefined
        });

        // Add Interim payments falling on this month
        const currentInterims = interimPayments.filter(p => p.month === i);
        currentInterims.forEach(interim => {
            items.push({
                description: `Ara Ödeme (${i}. Ay)`,
                payment_type: 'Balloon',
                amount: interim.amount,
                due_date: dateStr,
                currency: currency,
                notes: 'Ara Ödeme'
            });
        });
    }

    // Rounding adjustment for the last installment
    const currentSum = items.reduce((sum, item) => sum + item.amount, 0);
    const diff = grandTotal - currentSum;
    if (Math.abs(diff) > 0.01 && items.length > 1) {
        // Adjust the last installment (which is the last item if no interim on last month, 
        // or find the last 'Installment' type item)
        const lastInst = [...items].reverse().find(item => item.payment_type === 'Installment');
        if (lastInst) {
            lastInst.amount = Number((lastInst.amount + diff).toFixed(2));
        }
    }

    return {
        items,
        totalInterest: Number(totalInterest.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
        principalAfterDown
    };
}
