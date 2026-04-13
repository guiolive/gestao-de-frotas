#!/bin/bash
# Teste de conexão com o WebService SOAP do SEI-UFG
# Descobre SiglaSistema e IdentificacaoServico corretos

SEI_URL="https://sei.ufg.br/sei/ws/SeiWS.php"
USUARIO="oliveiraguilherme"

echo "=== Teste de conexão SEI-UFG ==="
echo "URL: $SEI_URL"
echo "Usuário: $USUARIO"
echo ""
read -s -p "Senha do SEI: " SENHA
echo ""
echo ""

# Testar combinações de SiglaSistema e IdentificacaoServico
echo "Testando combinações de SiglaSistema / IdentificacaoServico..."
echo ""

for SIGLA in "SeiWS" "SEI" "sei" "SeiSOAP" "WsSei" "SUPER" "SuperWS"; do
  for SERVICO in "SeiWS" "SEI" "sei" "SeiSOAP" "WsSei" "SUPER" "SuperSEI"; do
    RESULT=$(curl -s -X POST "$SEI_URL" \
      -H 'Content-Type: text/xml; charset=utf-8' \
      -H 'SOAPAction: "listarTiposProcedimento"' \
      --max-time 10 \
      -d "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:sei=\"Sei\">
  <soapenv:Body>
    <sei:listarTiposProcedimento>
      <SiglaSistema>$SIGLA</SiglaSistema>
      <IdentificacaoServico>$SERVICO</IdentificacaoServico>
      <IdUnidade></IdUnidade>
      <SiglaUsuario>$USUARIO</SiglaUsuario>
      <SenhaUsuario>$SENHA</SenhaUsuario>
    </sei:listarTiposProcedimento>
  </soapenv:Body>
</soapenv:Envelope>")

    if echo "$RESULT" | grep -q "IdTipoProcedimento"; then
      echo "✅ FUNCIONOU! SiglaSistema=$SIGLA IdentificacaoServico=$SERVICO"
      echo "$RESULT" > /tmp/sei-tipos.xml
      echo ""
      echo "--- Primeiros 3000 chars: ---"
      echo "$RESULT" | head -c 3000
      echo ""
      echo ""
      echo "=== Use: SiglaSistema=$SIGLA / IdentificacaoServico=$SERVICO ==="
      exit 0
    elif echo "$RESULT" | grep -q "faultstring"; then
      FAULT=$(echo "$RESULT" | grep -o 'faultstring>[^<]*' | sed 's/faultstring>//')
      # Só mostrar erros diferentes de "não encontrado" (pra não poluir)
      if echo "$FAULT" | grep -qi "senha\|usuario\|login\|acesso\|permiss"; then
        echo "🔑 $SIGLA/$SERVICO -> $FAULT"
      fi
    fi
  done
done

echo ""
echo "❌ Nenhuma combinação funcionou."
echo "Última resposta de erro:"
echo "$RESULT" | grep -o 'faultstring>[^<]*' | sed 's/faultstring>//'
echo ""
echo "Pode ser que seu usuário não tenha permissão de WebService."
echo "Pergunte ao CERCOMP qual é a SiglaSistema e IdentificacaoServico do WS do SEI-UFG."
