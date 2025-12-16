import Map from '../../components/Map';

const DashboardPage = () => {
  return (
    <div className='h-screen flex flex-col bg-slate-950'>
      <header className='p-4 bg-slate-900 border-b border-slate-800'>
        <h1 className='text-white font-bold'>EcoGuard Live Dashboard</h1>
      </header>
      <main className='flex-1'>
        <Map />
      </main>
    </div>
  );
};

export default DashboardPage;
