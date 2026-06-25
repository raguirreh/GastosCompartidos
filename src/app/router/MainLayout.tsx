import {
  HomeOutlined,
  TeamOutlined,
  PieChartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Tabs } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const TABS = [
  { key: 'home', label: 'Inicio', icon: <HomeOutlined /> },
  { key: 'groups', label: 'Grupos', icon: <TeamOutlined /> },
  { key: 'balances', label: 'Saldos', icon: <PieChartOutlined /> },
  { key: 'profile', label: 'Perfil', icon: <UserOutlined /> },
];

function activeTabKey(pathname: string): string {
  const segment = pathname.split('/')[2] ?? 'home';
  return TABS.some((tab) => tab.key === segment) ? segment : 'home';
}

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <main style={{ flex: 1, paddingBottom: 56 }}>
        <Outlet />
      </main>
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--ant-color-bg-container, #fff)',
          borderTop: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <Tabs
          activeKey={activeTabKey(location.pathname)}
          onChange={(key) => navigate(`/app/${key}`)}
          centered
          items={TABS.map((tab) => ({
            key: tab.key,
            label: (
              <span aria-label={tab.label}>
                {tab.icon} {tab.label}
              </span>
            ),
          }))}
        />
      </nav>
    </div>
  );
}
