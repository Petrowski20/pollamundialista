import AdminSubNav from '@/components/AdminSubNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full space-y-6">
      <AdminSubNav />
      {children}
    </div>
  )
}
