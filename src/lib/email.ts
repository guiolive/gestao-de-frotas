import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailAlerta {
  para: string;
  veiculo: { placa: string; modelo: string; marca: string; quilometragem: number };
  tipoAlerta: string;
  intervaloKm: number;
  kmProximaTroca: number;
}

const TIPO_LABELS: Record<string, string> = {
  troca_oleo: "Troca de Óleo",
  troca_pneus: "Troca de Pneus",
  revisao: "Revisão Geral",
  alinhamento: "Alinhamento e Balanceamento",
  filtro_ar: "Troca de Filtro de Ar",
  filtro_combustivel: "Troca de Filtro de Combustível",
  correia_dentada: "Troca de Correia Dentada",
  fluido_freio: "Troca de Fluido de Freio",
  fluido_arrefecimento: "Troca de Fluido de Arrefecimento",
};

export async function enviarEmailAlerta(dados: EmailAlerta) {
  const tipoLabel = TIPO_LABELS[dados.tipoAlerta] || dados.tipoAlerta;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e293b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">⚠️ Alerta de Manutenção Preventiva</h2>
        <p style="margin: 8px 0 0; opacity: 0.8;">Sistema de Gestão de Frotas</p>
      </div>
      <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
        <p>O veículo abaixo está próximo de necessitar manutenção:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 40%;">Veículo:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${dados.veiculo.placa} - ${dados.veiculo.marca} ${dados.veiculo.modelo}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Tipo de Manutenção:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${tipoLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">KM Atual:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${dados.veiculo.quilometragem.toLocaleString("pt-BR")} km</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Próxima Troca em:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${dados.kmProximaTroca.toLocaleString("pt-BR")} km</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Intervalo:</td>
            <td style="padding: 8px;">A cada ${dados.intervaloKm.toLocaleString("pt-BR")} km</td>
          </tr>
        </table>

        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin-top: 16px;">
          <p style="margin: 0; color: #92400e;"><strong>Ação necessária:</strong> Agende a manutenção preventiva o mais breve possível.</p>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: dados.para,
      subject: `⚠️ Alerta: ${tipoLabel} - ${dados.veiculo.placa}`,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return { success: false, error };
  }
}
