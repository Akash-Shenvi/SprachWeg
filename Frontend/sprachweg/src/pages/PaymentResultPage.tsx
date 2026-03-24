import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, LayoutDashboard, LoaderCircle, XCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

type PaymentFlow = 'training' | 'internship' | 'webinar';
type PaymentResult = 'success' | 'failure' | 'cancel' | 'pending';

const flowLabels: Record<PaymentFlow, string> = {
    training: 'Training',
    internship: 'Internship',
    webinar: 'Webinar',
};

const fallbackPathByFlow: Record<PaymentFlow, string> = {
    training: '/language-training',
    internship: '/careers',
    webinar: '/webinars',
};

const resultMeta: Record<PaymentResult, {
    title: string;
    description: string;
    icon: React.ReactNode;
    cardClass: string;
}> = {
    success: {
        title: 'Payment Confirmed',
        description: 'Your payment was verified successfully. The next step now depends on the program flow and any approval checks.',
        icon: <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />,
        cardClass: 'border-green-200 bg-green-50/80 dark:border-green-900/40 dark:bg-green-900/20',
    },
    pending: {
        title: 'Payment Pending',
        description: 'Your payment is still being confirmed by the gateway. Please check your dashboard again shortly.',
        icon: <LoaderCircle className="h-10 w-10 animate-spin text-[#b38f3f] dark:text-[#f0d28a]" />,
        cardClass: 'border-[#d6b161]/30 bg-[#d6b161]/10',
    },
    cancel: {
        title: 'Payment Cancelled',
        description: 'The checkout was closed before payment could be completed. You can start a fresh checkout whenever you are ready.',
        icon: <XCircle className="h-10 w-10 text-gray-600 dark:text-gray-300" />,
        cardClass: 'border-gray-200 bg-gray-100/80 dark:border-gray-700 dark:bg-[#112240]',
    },
    failure: {
        title: 'Payment Failed',
        description: 'The payment could not be completed successfully. You can review the details below and try again from the relevant program page.',
        icon: <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />,
        cardClass: 'border-red-200 bg-red-50/80 dark:border-red-900/40 dark:bg-red-900/20',
    },
};

const PaymentResultPage: React.FC = () => {
    const [searchParams] = useSearchParams();

    const flow = (searchParams.get('flow') || 'training') as PaymentFlow;
    const result = (searchParams.get('result') || 'failure') as PaymentResult;
    const attemptId = searchParams.get('attemptId');
    const transactionId = searchParams.get('transactionId');
    const referenceCode = searchParams.get('referenceCode');
    const message = searchParams.get('message');

    const safeFlow = flowLabels[flow] ? flow : 'training';
    const safeResult = resultMeta[result] ? result : 'failure';
    const meta = resultMeta[safeResult];

    return (
        <div className="min-h-screen bg-[#f6f4ef] text-[#0a192f] dark:bg-[#0a192f] dark:text-white">
            <Header />

            <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
                <div className={`rounded-[2rem] border p-8 shadow-sm ${meta.cardClass}`}>
                    <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 shadow-sm dark:bg-[#0a192f]">
                            {meta.icon}
                        </div>
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                                {flowLabels[safeFlow]} Payment
                            </p>
                            <h1 className="mt-1 text-3xl font-bold">{meta.title}</h1>
                        </div>
                    </div>

                    <p className="max-w-2xl text-base leading-7 text-gray-700 dark:text-gray-200">
                        {message || meta.description}
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/70 bg-white/70 p-5 dark:border-white/10 dark:bg-[#112240]">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                                Flow
                            </p>
                            <p className="mt-2 text-lg font-bold">{flowLabels[safeFlow]}</p>
                        </div>
                        <div className="rounded-2xl border border-white/70 bg-white/70 p-5 dark:border-white/10 dark:bg-[#112240]">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                                Result
                            </p>
                            <p className="mt-2 text-lg font-bold">
                                {safeResult === 'success'
                                    ? 'Verified'
                                    : safeResult === 'pending'
                                        ? 'Pending'
                                        : safeResult === 'cancel'
                                            ? 'Cancelled'
                                            : 'Failed'}
                            </p>
                        </div>
                        {attemptId && (
                            <div className="rounded-2xl border border-white/70 bg-white/70 p-5 dark:border-white/10 dark:bg-[#112240]">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                                    Attempt ID
                                </p>
                                <p className="mt-2 break-all font-mono text-sm font-bold">{attemptId}</p>
                            </div>
                        )}
                        {transactionId && (
                            <div className="rounded-2xl border border-white/70 bg-white/70 p-5 dark:border-white/10 dark:bg-[#112240]">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                                    Transaction ID
                                </p>
                                <p className="mt-2 break-all font-mono text-sm font-bold">{transactionId}</p>
                            </div>
                        )}
                        {referenceCode && (
                            <div className="rounded-2xl border border-white/70 bg-white/70 p-5 dark:border-white/10 dark:bg-[#112240] sm:col-span-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                                    Reference Code
                                </p>
                                <p className="mt-2 break-all font-mono text-sm font-bold">{referenceCode}</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link
                            to="/student-dashboard"
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0a192f] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#112240] dark:bg-[#d6b161] dark:text-[#0a192f] dark:hover:bg-[#c6a24f]"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Open Dashboard
                        </Link>
                        <Link
                            to={fallbackPathByFlow[safeFlow]}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition-colors hover:border-[#d6b161] hover:text-[#b38f3f] dark:border-white/10 dark:bg-[#112240] dark:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back To {flowLabels[safeFlow]}
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PaymentResultPage;
