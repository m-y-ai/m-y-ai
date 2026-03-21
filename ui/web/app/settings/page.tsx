import { PackageInstaller } from '@/components/settings/package-installer'

export const metadata = {
  title: 'Settings — m-y-ai',
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl space-y-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your m-y-ai system configuration.</p>
        </div>

        <section>
          <PackageInstaller />
        </section>
      </div>
    </div>
  )
}
