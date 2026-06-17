import type { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Privacy Policy | NOVO Messenger',
    description: 'Privacy Policy for NOVO Messenger Facebook application.',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="py-24 bg-slate-950 min-h-screen">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-slate-900/50 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-slate-800 shadow-2xl">
                    <h1 className="text-4xl font-extrabold text-white mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                        Privacy Policy for NOVO Messenger
                    </h1>

                    <div className="text-slate-400 space-y-8 leading-relaxed">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest italic">
                                Effective Date: March 03, 2026
                            </p>
                        </div>

                        <p className="text-lg">
                            This Privacy Policy describes how NOVO Messenger (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) collects,
                            uses, and protects information when you use our Facebook application.
                        </p>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">01</span>
                                Information We Collect
                            </h2>
                            <p className="mb-4 pl-11 text-slate-400">We may collect the following types of information:</p>
                            <ul className="list-disc pl-16 space-y-2 text-slate-300">
                                <li>Public profile information (such as name and profile picture) provided through Facebook login.</li>
                                <li>Email address, if granted by the user.</li>
                                <li>Messages or content submitted through the app.</li>
                                <li>Technical data such as device information, browser type, and usage logs.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">02</span>
                                How We Use Information
                            </h2>
                            <p className="mb-4 pl-11 text-slate-400">We use collected information to:</p>
                            <ul className="list-disc pl-16 space-y-2 text-slate-300">
                                <li>Provide and operate the NOVO Messenger service.</li>
                                <li>Improve functionality and user experience.</li>
                                <li>Respond to inquiries and provide customer support.</li>
                                <li>Comply with legal obligations.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">03</span>
                                Data Sharing
                            </h2>
                            <p className="pl-11 text-slate-400">We do not sell, trade, or rent users&apos; personal information. Information may only be shared:</p>
                            <ul className="list-disc pl-16 mt-4 space-y-2 text-slate-300">
                                <li>When required by law.</li>
                                <li>With service providers that help operate the app (under confidentiality agreements).</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">04</span>
                                Data Retention
                            </h2>
                            <p className="pl-11 text-slate-400">We retain personal data only as long as necessary to provide the service or comply with legal obligations.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">05</span>
                                Data Security
                            </h2>
                            <p className="pl-11 text-slate-400">We implement reasonable technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">06</span>
                                Your Rights
                            </h2>
                            <p className="mb-4 pl-11 text-slate-400">Depending on your jurisdiction, you may have the right to:</p>
                            <ul className="list-disc pl-16 space-y-2 text-slate-300">
                                <li>Access your personal data.</li>
                                <li>Request correction or deletion.</li>
                                <li>Withdraw consent at any time.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">07</span>
                                Third-Party Services
                            </h2>
                            <p className="pl-11 text-slate-400 font-medium">NOVO Messenger operates on Facebook’s platform and may use Facebook APIs subject to Facebook’s Platform Terms and Data Policy.</p>
                        </section>

                        <section className="pt-8 border-t border-slate-800">
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">08</span>
                                Contact Information
                            </h2>
                            <p className="pl-11 mb-2 text-slate-400">If you have any questions about this Privacy Policy, you may contact us at:</p>
                            <p className="pl-11 font-bold text-xl text-blue-400 hover:text-blue-300 transition-colors">melis@btproses.com</p>
                        </section>

                        <div className="pt-4">
                            <p className="text-sm italic text-slate-500 pl-11">
                                We reserve the right to update this Privacy Policy at any time. Updates will be reflected by revising the effective date above.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
