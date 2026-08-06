# Guia de Qualificação e Coleta de Dados para Orçamento de Esquadrias (Multimaterial)
*Este documento consolida todas as informações necessárias para qualificar leads no CRM e coletar dados precisos para o orçamentista técnico, cobrindo Alumínio, PVC e Madeira.*

---

## 1. Triagem Inicial e Dados Gerais da Obra
Antes de definir o material, a IA ou o pré-vendedor no CRM precisa coletar os dados geográficos e estruturais da obra. Esses fatores determinam a pressão de vento e as exigências técnicas que o fabricante precisará respeitar:

*   **Localização da Obra (Cidade/Região):** Fundamental para cruzar com o gráfico de isopletas de vento do Brasil [149] e identificar se há exposição a maresia (que exige alumínio anodizado [196] ou PVC de alta resistência [198]).
*   **Número de Pavimentos e Altura da Obra:** O número de andares determina a carga de pressão de vento exigida por norma (ABNT NBR 10821) [149, 150, 158].
*   **Fase Atual da Obra:** 
    *   *Alvenaria/Estrutura:* Ideal para o uso de contramarco (que deve ser chumbado previamente) [244, 354].
    *   *Acabamento/Reboco Pronto:* Exige instalação sem contramarco (parafusado diretamente com espuma de PU ou grapas de chumbamento tardio) [250, 258, 260].

---

## 2. Dinâmica de Medição: Metragem Pronta vs. Visita Técnica
O orçamentista precisa saber exatamente como as medidas foram obtidas para calcular as folgas de instalação e a quantidade de material.

### Cenário A: Cliente com "Metragem Pronta"
Se o cliente já possui as medidas (seja de um projeto arquitetônico ou medição própria), a IA deve coletar:
1.  **Tipo de Arquivo:** Solicitar o **Projeto de Arquitetura (em PDF ou DWG)** ou a **Lista de Vãos/Caderno de Esquadrias**.
2.  **Aviso de Responsabilidade:** O bot/atendente deve registrar no CRM: 
    > *"Orçamento inicial gerado com base nas medidas fornecidas pelo cliente. A fabricação final fica sujeita à conferência técnica in loco após a assinatura do contrato."*

### Cenário B: Cliente Solicitando "Visita Técnica para Medição"
A visita tem custo logístico (gasolina, tempo, desgaste do carro) [363, 364]. Para evitar visitas perdidas, qualifique o lead antes de agendar:
1.  **Os vãos já estão requadrados e rebocados?** Não se deve medir vãos em tijolo bruto, pois o reboco altera as medidas finais em centímetros [259].
2.  **Há definição de nível de piso (soleiras e pingadeiras)?** O orçamentista precisa saber a altura do piso acabado para definir o desconto das portas e evitar erros de estanqueidade [159, 243].
3.  **Janela de agendamento:** Agendar preferencialmente quando a obra estiver limpa de entulho de alvenaria e com energia elétrica disponível [242].

---

## 3. Qualificação Específica por Material

O atendente ou a IA deve guiar o cliente na escolha do material (Alumínio, PVC ou Madeira), explicando as diferenças técnicas e de custo:

```
                  ┌───────────────────────────┐
                  │   Escolha do Material     │
                  └─────────────┬─────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
  ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
  │   Alumínio   │       │     PVC      │       │   Madeira    │
  └──────┬───────┘       └──────┬───────┘       └──────┬───────┘
         │                      │                      │
 ┌───────┴───────┐      ┌───────┴───────┐      ┌───────┴───────┐
 │ Suprema (25mm)│      │Alto Isolamento│      │Custom/No Nobre│
 │ vs Gold (32mm)│      │ Térmico/Acúst │      │ Legal (FSC)   │
 └───────────────┘      └───────────────┘      └───────────────┘
```

### A. Alumínio (O mais versátil para edifícios) [353]
*   **Linha Suprema (25mm):** Indicada para vãos médios e padrão. Excelente custo-benefício para dormitórios, banheiros e cozinhas padrão [335, 337].
*   **Linha Gold (32mm):** Indicada para grandes vãos, portas de correr pesadas (pé-direito duplo), vidros duplos/laminados e regiões de ventos fortes (como coberturas ou litoral) [335, 336, 338].
*   **Estratégia de Economia:** Perguntar ao cliente se aceita **mesclar as duas linhas** na mesma obra (ex: Gold na sala de estar para valorizar a fachada e Suprema nos banheiros/quartos para reduzir o custo total) [335, 339, 341].
*   **Acabamento:** Pintura eletrostática (Branco, Preto, Bronze) ou Anodização (Inox, Bronze, Natural) [151, 197].

### B. PVC (O campeão em isolamento térmico e acústico) [198, 299]
*   **Argumento de Venda:** Possui estrutura interna com reforço de aço galvanizado [198], não sofre corrosão e oferece o melhor desempenho acústico e térmico do mercado [198, 298].
*   **Custo:** Geralmente tem o valor de aquisição mais elevado (pode ser até 35% mais caro que o alumínio certificado de igual padrão) [354].
*   **Indicação:** Residências de alto padrão, hotéis e clientes que exigem silêncio absoluto [353, 355].

### C. Madeira (Sofisticação e rusticidade sob medida) [357]
*   **Uso e Localização:** O orçamentista precisa saber a classificação da porta pela norma ABNT NBR 15930-2 [131, 132]:
    *   **PIM:** Porta Interna de Madeira (quartos e banheiros comuns) [173, 174].
    *   **PEM:** Porta de Entrada de Madeira (apartamentos/corredores) [173, 174].
    *   **PXM:** Porta Externa de Madeira (exposta a sol e chuva direta - exige verniz/selante com filtro UV frequente) [173, 174, 358].
*   **Exigência Ambiental (Crucial):** Toda madeira tropical deve ter comprovação de **origem legal (Documento de Origem Florestal - DOF)** ou **Certificação FSC** [4, 8, 34, 57]. Perguntar se o cliente faz questão de madeira certificada (exigida em obras com certificações verdes) [9, 57].
*   **Manutenção:** Alertar o cliente que esquadrias de madeira externa exigem repintura/envernizamento a cada 3 a 5 anos [358].

---

## 4. O Checklist do Orçamentista (O que coletar por esquadria)
Para cada porta ou janela, preencha a tabela de triagem abaixo no CRM antes de enviar para o setor de cálculo técnico:

| Item | Pergunta de Qualificação | Resposta do Lead / Opções |
| :--- | :--- | :--- |
| **01** | **Tipologia da Esquadria** | Janela de correr, basculante, maxim-ar, porta de giro, porta de correr, camarão, etc. [137, 148] |
| **02** | **Dimensões do Vão (ou da peça)** | Largura (mm) x Altura (mm) x Espessura da Parede (mm) [278, 284] |
| **03** | **Material Principal** | Alumínio (Suprema / Gold), PVC ou Madeira (PIM / PEM / PXM) [151, 152, 173] |
| **04** | **Tipo de Vidro Exigido** | Monolítico comum, Temperado (segurança), Laminado (segurança/acústica) ou Insulado/Duplo (termoacústico) [189, 190, 191] |
| **05** | **Cor/Acabamento** | Pintura eletrostática (cor), Anodização (classe), Laca (madeira), Verniz ou Natural [151, 203, 279] |
| **06** | **Acessórios / Componentes** | Com ou sem persiana integrada (manual ou motorizada) [137, Anexo A]? Tipo de fechadura/puxador [263, 284]? |
| **07** | **Instalação Inclusa?** | Sim (exige saber se usará contramarco [121, 244]) ou Não (apenas entrega ex works) [138]. |

---

## 5. Scripts de Atendimento CRM (WhatsApp/Chatbot)
Copie estes scripts para automatizar a abordagem do robô ou guiar a equipe comercial:

### Script 1: Para quem tem projeto/metragem pronta
> *"Olá, [Nome do Lead]! Que ótimo que você já tem as medidas do seu projeto. Para que nossa equipe de engenharia calcule o orçamento exato (evitando qualquer prejuízo ou falta de componentes), você poderia me enviar o **PDF do seu projeto arquitetônico** ou o **caderno de esquadrias**? Se tiver preferência por Alumínio, PVC ou Madeira, já pode me sinalizar por aqui também!"*

### Script 2: Para quem precisa de visita técnica de medição
> *"Olá, [Nome do Lead]! Claro, nós realizamos a medição técnica in loco para garantir que tudo fique perfeito. Antes de agendarmos a visita do nosso técnico, me conta: **as paredes dos vãos onde ficarão as janelas e portas já estão rebocadas e com o nível do piso acabado definido?** Isso é super importante para que as medidas colhidas sejam definitivas e a sua instalação não sofra atrasos!"*

### Script 3: Para quem está em dúvida sobre o material
> *"Compreendo perfeitamente! Cada material tem uma vantagem única para a sua casa:*
> *1. O **Alumínio** é muito durável, moderno e permite mesclar linhas leves (como a Suprema) com linhas robustas (como a Gold) para economizar na obra.*
> *2. O **PVC** oferece o isolamento térmico e acústico mais alto do mercado, ideal para quem quer silêncio absoluto e economia de ar-condicionado.*
> *3. A **Madeira** traz uma sofisticação clássica e conforto natural incomparável, trabalhando apenas com fornecedores de origem florestal estritamente legal e certificada FSC.*
> *Qual desses benefícios faz mais sentido para o seu momento atual?"*
