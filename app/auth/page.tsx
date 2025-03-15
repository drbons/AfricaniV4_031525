import AuthForm from '@/components/auth/AuthForm';

export default function AuthPage() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">African Business Directory</h1>
        <AuthForm />
      </div>
    </div>
  );
}