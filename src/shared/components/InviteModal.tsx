import { CopyOutlined, ShareAltOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { Button, Modal, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { buildGroupInviteLink, buildWhatsAppInviteUrl, buildWhatsAppWebInviteUrl } from '../utils/invite';
import { openWhatsApp, shareOrCopy } from '../utils/share';

interface InviteModalProps {
  visible: boolean;
  onDismiss: () => void;
  inviteToken: string;
  groupName: string;
}

/** Modal de invitación a un grupo: link, copiar, compartir por WhatsApp, compartir nativo y QR. */
export function InviteModal({ visible, onDismiss, inviteToken, groupName }: InviteModalProps) {
  const [copied, setCopied] = useState(false);

  const link = useMemo(() => buildGroupInviteLink(inviteToken), [inviteToken]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = async () => {
    const nativeUrl = buildWhatsAppInviteUrl(groupName, link);
    const webUrl = buildWhatsAppWebInviteUrl(groupName, link);
    const opened = await openWhatsApp(nativeUrl, webUrl);
    if (!opened) {
      await shareOrCopy(link);
    }
  };

  const handleNativeShare = async () => {
    await shareOrCopy(link);
  };

  return (
    <Modal open={visible} onCancel={onDismiss} footer={null} centered title={`Invitar a "${groupName}"`}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ padding: 12, background: '#fff', borderRadius: 12 }}>
          <QRCodeSVG value={link} size={180} />
        </div>

        <Typography.Text type="secondary" style={{ textAlign: 'center' }}>
          {link}
        </Typography.Text>

        <Button icon={<CopyOutlined />} block onClick={handleCopy}>
          {copied ? 'Copiado' : 'Copiar link'}
        </Button>

        <Button type="primary" icon={<WhatsAppOutlined />} block onClick={handleWhatsApp}>
          Compartir por WhatsApp
        </Button>

        <Button type="text" icon={<ShareAltOutlined />} block onClick={handleNativeShare}>
          Compartir...
        </Button>
      </div>
    </Modal>
  );
}
