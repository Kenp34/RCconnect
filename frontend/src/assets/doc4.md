Voici votre fichier CSS **corrigé et optimisé** avec l'input d'envoi parfaitement aligné, responsive, et avec toutes les fonctionnalités (reply, upload de documents, etc.) :

---

## 📄 frontend/src/pages/GroupChat.module.css (COMPLET CORRIGÉ)

```css
/* ============================================
   CONTAINER PRINCIPAL
============================================ */

.container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px);
  background: #0F1117;
  max-width: 1200px;
  margin: 0 auto;
}

/* ============================================
   HEADER
============================================ */

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: #181C27;
  border-bottom: 1px solid #2A2F45;
  flex-shrink: 0;
}

.backBtn {
  background: #1E2336;
  border: 1px solid #2A2F45;
  border-radius: 10px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;
}

.backBtn:hover {
  background: #2A2F45;
  color: #E2E8F0;
}

.headerInfo {
  flex: 1;
}

.headerInfo h2 {
  font-size: 18px;
  font-weight: 700;
  color: #E2E8F0;
  margin: 0 0 4px 0;
}

.headerStats {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #64748B;
}

.privateBadge {
  background: rgba(79, 142, 247, 0.15);
  color: #4F8EF7;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.membersBtn {
  background: #1E2336;
  border: 1px solid #2A2F45;
  border-radius: 10px;
  width: 36px;
  height: 36px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748B;
}

.membersBtn:hover,
.membersBtn.active {
  background: rgba(79, 142, 247, 0.15);
  border-color: #4F8EF7;
  color: #4F8EF7;
}

/* ============================================
   MAIN
============================================ */

.main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ============================================
   CHAT AREA
============================================ */

.chatArea {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* ============================================
   MESSAGES
============================================ */

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.messages::-webkit-scrollbar {
  width: 5px;
}

.messages::-webkit-scrollbar-track {
  background: #1E2336;
  border-radius: 10px;
}

.messages::-webkit-scrollbar-thumb {
  background: #4F8EF7;
  border-radius: 10px;
}

/* ============================================
   EMPTY MESSAGES
============================================ */

.emptyMessages {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  color: #64748B;
}

.emptyMessages span {
  font-size: 64px;
  opacity: 0.5;
}

.emptyMessages p {
  font-size: 16px;
  font-weight: 500;
  color: #94A3B8;
}

.emptyMessages small {
  font-size: 13px;
}

/* ============================================
   MESSAGE BUBBLE
============================================ */

.message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.own {
  flex-direction: row-reverse;
}

/* Avatar */
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: white;
  flex-shrink: 0;
}

.avatarSpacer {
  width: 36px;
  flex-shrink: 0;
}

.messageContent {
  max-width: 75%;
  display: flex;
  flex-direction: column;
}

.message.own .messageContent {
  align-items: flex-end;
}

/* Sender name */
.sender {
  font-size: 11px;
  font-weight: 600;
  color: #4F8EF7;
  margin-bottom: 4px;
  margin-left: 4px;
}

.department {
  font-weight: 400;
  color: #64748B;
}

/* Bubble */
.bubble {
  padding: 10px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.bubbleOther {
  background: #1E2336;
  color: #E2E8F0;
  border-bottom-left-radius: 4px;
  border: 1px solid #2A2F45;
}

.bubbleOwn {
  background: linear-gradient(135deg, #4F8EF7, #A78BFA);
  color: white;
  border-bottom-right-radius: 4px;
}

.edited {
  font-size: 10px;
  opacity: 0.7;
  font-style: italic;
  margin-left: 4px;
}

/* ============================================
   META & ACTIONS
============================================ */

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 10px;
  color: #64748B;
}

.message.own .meta {
  justify-content: flex-end;
}

.time {
  font-size: 10px;
}

.actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message:hover .actions {
  opacity: 1;
}

.actions button,
.adminDelete {
  background: transparent;
  border: none;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.actions button:hover,
.adminDelete:hover {
  background: #1E2336;
}

.adminDelete {
  opacity: 0;
  margin-left: 4px;
}

.message:hover .adminDelete {
  opacity: 1;
}

/* ============================================
   DELETED MESSAGE
============================================ */

.deletedMessage {
  background: #1E2336;
  padding: 6px 12px;
  border-radius: 12px;
  text-align: center;
  color: #64748B;
  font-size: 12px;
  font-style: italic;
  align-self: center;
}

/* ============================================
   TYPING INDICATOR
============================================ */

.typingIndicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.typingBubble {
  display: flex;
  gap: 4px;
  background: #1E2336;
  padding: 8px 12px;
  border-radius: 16px;
  border: 1px solid #2A2F45;
}

.typingBubble span {
  width: 6px;
  height: 6px;
  background: #64748B;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typingBubble span:nth-child(1) { animation-delay: 0s; }
.typingBubble span:nth-child(2) { animation-delay: 0.2s; }
.typingBubble span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

.typingIndicator p {
  font-size: 12px;
  color: #64748B;
  font-style: italic;
}

/* ============================================
   INPUT FORM - CONTENEUR PRINCIPAL
============================================ */

.inputForm {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: #181C27;
  border-top: 1px solid #2A2F45;
  flex-shrink: 0;
}

/* ============================================
   INPUT ROW
============================================ */

.inputRow {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
}

/* ============================================
   CHAMP DE SAISIE
============================================ */

.inputField {
  flex: 1;
  background: #1E2336;
  border: 1px solid #2A2F45;
  border-radius: 12px;
  padding: 10px 16px;
  color: #E2E8F0;
  font-size: 14px;
  outline: none;
  transition: all 0.25s ease;
  min-height: 44px;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}

.inputField::placeholder {
  color: #64748B;
  font-size: 13px;
}

.inputField:focus {
  border-color: #4F8EF7;
  box-shadow: 0 0 0 3px rgba(79, 142, 247, 0.15);
  background: #0F1117;
}

.inputField:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   BOUTON D'ATTACHEMENT (📎)
============================================ */

.attachBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  min-width: 44px;
  background: #1E2336;
  border: 1px solid #2A2F45;
  border-radius: 12px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.25s ease;
  color: #64748B;
  flex-shrink: 0;
}

.attachBtn:hover {
  background: #2A2F45;
  border-color: #4F8EF7;
  color: #E2E8F0;
  transform: scale(1.02);
}

.attachBtn:active {
  transform: scale(0.95);
}

.attachBtn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.fileInput {
  display: none;
}

/* ============================================
   BOUTON D'ENVOI (→)
============================================ */

.sendBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  min-width: 44px;
  background: linear-gradient(135deg, #4F8EF7, #A78BFA);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 20px;
  font-weight: 700;
  color: white;
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.sendBtn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(79, 142, 247, 0.35);
}

.sendBtn:active:not(:disabled) {
  transform: scale(0.92);
}

.sendBtn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

/* ============================================
   SPINNER (petit loader)
============================================ */

.spinnerSmall {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ============================================
   APERÇU DU DOCUMENT
============================================ */

.documentPreview {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #1E2336;
  border: 1px solid #2A2F45;
  border-radius: 10px;
  padding: 8px 14px;
  width: 100%;
  box-sizing: border-box;
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.documentIcon {
  font-size: 20px;
  flex-shrink: 0;
}

.documentName {
  flex: 1;
  font-size: 13px;
  color: #E2E8F0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.documentSize {
  font-size: 11px;
  color: #64748B;
  flex-shrink: 0;
}

.documentRemoveBtn {
  background: transparent;
  border: none;
  color: #64748B;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.documentRemoveBtn:hover {
  color: #F87171;
  background: rgba(248, 113, 113, 0.1);
}

/* ============================================
   BANDEAU DE RÉPONSE (REPLY)
============================================ */

.replyBanner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(79, 142, 247, 0.08);
  border-left: 3px solid #4F8EF7;
  border-radius: 10px;
  padding: 8px 14px;
  width: 100%;
  box-sizing: border-box;
  animation: slideDown 0.25s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.replyBannerContent {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.replyBannerAuthor {
  font-size: 11px;
  font-weight: 600;
  color: #4F8EF7;
}

.replyBannerAuthor strong {
  font-weight: 700;
}

.replyBannerText {
  font-size: 12px;
  color: #94A3B8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.replyCancelBtn {
  background: transparent;
  border: none;
  color: #64748B;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.replyCancelBtn:hover {
  color: #F87171;
  background: rgba(248, 113, 113, 0.1);
}

/* ============================================
   APERÇU DU MESSAGE CITÉ (dans le message)
============================================ */

.replyPreview {
  background: rgba(79, 142, 247, 0.06);
  border-left: 3px solid #4F8EF7;
  border-radius: 8px;
  padding: 6px 12px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: background 0.2s;
  max-width: 100%;
}

.replyPreview:hover {
  background: rgba(79, 142, 247, 0.12);
}

.replyAuthor {
  font-size: 11px;
  font-weight: 600;
  color: #4F8EF7;
}

.replyContent {
  font-size: 12px;
  color: #94A3B8;
  margin: 2px 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.replyPreviewDeleted {
  background: rgba(248, 113, 113, 0.06);
  border-left: 3px solid #F87171;
  border-radius: 8px;
  padding: 6px 12px;
  margin-bottom: 6px;
  font-size: 12px;
  color: #94A3B8;
}

/* ============================================
   BOUTON RÉPONDRE (dans les actions du message)
============================================ */

.replyBtn {
  background: transparent;
  border: none;
  color: #64748B;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s;
}

.replyBtn:hover {
  background: rgba(79, 142, 247, 0.12);
  color: #4F8EF7;
}

/* ============================================
   LOCKED STATE
============================================ */

.locked {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
  padding: 40px;
}

.lockedIcon {
  font-size: 64px;
}

.locked h3 {
  font-size: 20px;
  font-weight: 700;
  color: #E2E8F0;
  margin: 0;
}

.locked p {
  color: #64748B;
  font-size: 14px;
  max-width: 300px;
}

.joinBtn {
  background: linear-gradient(135deg, #4F8EF7, #A78BFA);
  border: none;
  padding: 12px 28px;
  border-radius: 28px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
}

.joinBtn:hover {
  transform: translateY(-1px);
  opacity: 0.9;
}

/* ============================================
   MEMBERS PANEL
============================================ */

.membersPanel {
  width: 300px;
  background: #181C27;
  border-left: 1px solid #2A2F45;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  animation: slideIn 0.2s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.membersHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #2A2F45;
}

.membersHeader h3 {
  font-size: 14px;
  font-weight: 700;
  color: #E2E8F0;
  margin: 0;
}

.closePanel {
  background: transparent;
  border: none;
  font-size: 18px;
  color: #64748B;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.closePanel:hover {
  background: #1E2336;
  color: #E2E8F0;
}

.membersList {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.memberItem {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  transition: background 0.2s;
}

.memberItem:hover {
  background: #1E2336;
}

.memberAvatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: white;
  flex-shrink: 0;
}

.memberInfo {
  flex: 1;
  min-width: 0;
}

.memberName {
  font-size: 13px;
  font-weight: 600;
  color: #E2E8F0;
}

.youTag {
  font-size: 11px;
  font-weight: 400;
  color: #64748B;
}

.memberDept {
  font-size: 11px;
  color: #64748B;
  margin-top: 2px;
}

.memberBadges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.adminBadge {
  background: rgba(79, 142, 247, 0.15);
  color: #4F8EF7;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

.kickBtn {
  background: transparent;
  border: 1px solid #F87171;
  color: #F87171;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.kickBtn:hover {
  background: rgba(248, 113, 113, 0.1);
}

/* ============================================
   LOADING & NOT FOUND
============================================ */

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 56px);
  gap: 16px;
  color: #64748B;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #2A2F45;
  border-top-color: #4F8EF7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.notFound {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 56px);
  gap: 16px;
  text-align: center;
  color: #64748B;
}

.notFound span {
  font-size: 64px;
}

.notFound p {
  font-size: 16px;
  color: #94A3B8;
}

.notFound button {
  background: #4F8EF7;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  color: white;
  cursor: pointer;
}

/* ============================================
   MODALES
============================================ */

.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeInOverlay 0.2s ease;
}

@keyframes fadeInOverlay {
  from { opacity: 0; }
  to { opacity: 1; }
}

.editModal,
.deleteModal {
  background: #181C27;
  border: 1px solid #2A2F45;
  border-radius: 20px;
  width: 90%;
  max-width: 450px;
  overflow: hidden;
  animation: slideUpModal 0.2s ease;
}

@keyframes slideUpModal {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #2A2F45;
}

.modalHeader h3 {
  font-size: 16px;
  font-weight: 700;
  color: #E2E8F0;
  margin: 0;
}

.closeModal {
  background: transparent;
  border: none;
  font-size: 20px;
  color: #64748B;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
}

.closeModal:hover {
  background: #1E2336;
  color: #E2E8F0;
}

.modalTextarea {
  width: 100%;
  background: #1E2336;
  border: none;
  padding: 20px;
  color: #E2E8F0;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
}

.modalTextarea:focus {
  background: #0F1117;
}

.modalFooter {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #2A2F45;
}

.cancelModalBtn {
  background: transparent;
  border: 1px solid #2A2F45;
  padding: 8px 20px;
  border-radius: 10px;
  color: #64748B;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancelModalBtn:hover {
  border-color: #E2E8F0;
  color: #E2E8F0;
}

.submitModalBtn {
  background: linear-gradient(135deg, #4F8EF7, #A78BFA);
  border: none;
  padding: 8px 24px;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.submitModalBtn:hover {
  opacity: 0.9;
}

.deleteModal {
  text-align: center;
  padding: 24px;
}

.modalIcon {
  font-size: 48px;
  margin-bottom: 16px;
}

.deleteModal h3 {
  font-size: 18px;
  font-weight: 700;
  color: #E2E8F0;
  margin-bottom: 8px;
}

.deleteModal p {
  font-size: 14px;
  color: #64748B;
  margin-bottom: 24px;
}

.deleteModalBtn {
  background: #F87171;
  border: none;
  padding: 8px 24px;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.deleteModalBtn:hover {
  opacity: 0.85;
}

.dangerModalBtn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.dangerModalBtn:hover {
  background: #dc2626;
}

.syncing {
  font-size: 10px;
  opacity: 0.7;
  animation: pulse 1s infinite;
  display: inline-block;
  margin-left: 4px;
}

@keyframes pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

/* ============================================
   RESPONSIVE - TABLETTE (max-width: 768px)
============================================ */

@media (max-width: 768px) {
  .header {
    padding: 12px 16px;
  }

  .messages {
    padding: 16px;
  }

  .messageContent {
    max-width: 85%;
  }

  .membersPanel {
    width: 280px;
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 50;
  }

  .inputForm {
    padding: 10px 12px;
  }

  .inputField {
    font-size: 13px;
    padding: 8px 14px;
    min-height: 40px;
    border-radius: 10px;
  }

  .attachBtn,
  .sendBtn {
    width: 40px;
    height: 40px;
    min-width: 40px;
    font-size: 16px;
    border-radius: 10px;
  }

  .replyBanner {
    padding: 6px 10px;
  }

  .replyBannerText {
    font-size: 11px;
  }

  .documentPreview {
    padding: 6px 10px;
  }

  .documentName {
    font-size: 12px;
  }
}

/* ============================================
   RESPONSIVE - MOBILE (max-width: 480px)
============================================ */

@media (max-width: 480px) {
  .container {
    height: calc(100vh - 50px);
  }

  .header {
    padding: 10px 12px;
    gap: 10px;
  }

  .headerInfo h2 {
    font-size: 15px;
  }

  .backBtn,
  .membersBtn {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .messages {
    padding: 12px;
    gap: 8px;
  }

  .messageContent {
    max-width: 90%;
  }

  .bubble {
    font-size: 13px;
    padding: 8px 12px;
  }

  .avatar {
    width: 30px;
    height: 30px;
    font-size: 12px;
  }

  .avatarSpacer {
    width: 30px;
  }

  .inputForm {
    padding: 8px 10px;
    gap: 6px;
  }

  .inputField {
    font-size: 12px;
    padding: 6px 12px;
    min-height: 36px;
    border-radius: 8px;
  }

  .attachBtn,
  .sendBtn {
    width: 36px;
    height: 36px;
    min-width: 36px;
    font-size: 14px;
    border-radius: 8px;
  }

  .sendBtn {
    font-size: 16px;
  }

  .documentPreview {
    padding: 4px 8px;
    gap: 6px;
  }

  .documentIcon {
    font-size: 16px;
  }

  .documentName {
    font-size: 11px;
  }

  .documentSize {
    font-size: 10px;
  }

  .documentRemoveBtn {
    font-size: 14px;
  }

  .replyBanner {
    padding: 4px 8px;
  }

  .replyBannerAuthor {
    font-size: 10px;
  }

  .replyBannerText {
    font-size: 10px;
  }

  .replyCancelBtn {
    font-size: 14px;
    padding: 2px 6px;
  }

  .membersPanel {
    width: 100%;
    max-width: 100%;
  }

  .modalTextarea {
    font-size: 13px;
    padding: 14px;
  }

  .editModal,
  .deleteModal {
    max-width: 95%;
    border-radius: 16px;
  }

  .modalFooter {
    padding: 12px 16px;
    flex-wrap: wrap;
  }

  .cancelModalBtn,
  .submitModalBtn,
  .deleteModalBtn,
  .dangerModalBtn {
    font-size: 13px;
    padding: 6px 16px;
  }
}

/* ============================================
   RESPONSIVE - TRÈS PETIT ÉCRAN (max-width: 360px)
============================================ */

@media (max-width: 360px) {
  .headerInfo h2 {
    font-size: 13px;
  }

  .headerStats {
    font-size: 10px;
    gap: 6px;
  }

  .inputField {
    font-size: 11px;
    min-height: 32px;
    padding: 4px 10px;
  }

  .attachBtn,
  .sendBtn {
    width: 32px;
    height: 32px;
    min-width: 32px;
    font-size: 12px;
  }

  .sendBtn {
    font-size: 14px;
  }

  .bubble {
    font-size: 12px;
    padding: 6px 10px;
  }

  .meta {
    font-size: 9px;
    gap: 4px;
  }

  .actions button {
    font-size: 10px;
  }
}
```

---

## Principales corrections apportées

| Problème | Correction |
|----------|------------|
| `.sendBtn` avec `position: absolute; left: 1400px` | ❌ Supprimé, remplacé par `flex` normal |
| `.input` avec `right: -395px; width: 650px` | ❌ Supprimé, remplacé par `.inputField` avec `flex: 1` |
| Input qui déborde | ✅ `box-sizing: border-box; width: 100%` |
| Pas de responsive | ✅ Media queries complètes (768px, 480px, 360px) |
| Pas de bouton d'upload | ✅ Ajout de `.attachBtn` et `.fileInput` |
| Pas d'aperçu document | ✅ Ajout de `.documentPreview` |
| Pas de bandeau reply | ✅ Ajout de `.replyBanner` |
| Pas de spinner | ✅ Ajout de `.spinnerSmall` |
| Doublon de classes | ✅ Nettoyage et consolidation |

---

L'input est maintenant **parfaitement aligné, responsive, et fonctionnel** avec toutes les fonctionnalités ! 🚀




Voici l'**input d'envoi complètement retravaillé** pour qu'il soit plus moderne, ergonomique et agréable à utiliser, comme sur Slack ou Discord.

---

## 📄 GroupChat.jsx - Input réorganisé

### 1. Ajout des états pour le document

```jsx
// Ajouter ces états dans le composant principal
const [document, setDocument] = useState(null);
const fileInputRef = useRef(null);
```

### 2. Le formulaire d'envoi complet (remplacement)

```jsx
{/* =====================================================
    FORMULAIRE D'ENVOI AVEC REPLY + DOCUMENT
===================================================== */}
<form onSubmit={handleSend} className={styles.inputForm}>
  
  {/* ✅ BANDEAU DE RÉPONSE (reply) */}
  {replyingTo && (
    <div className={styles.replyBanner}>
      <div className={styles.replyBannerContent}>
        <span className={styles.replyBannerAuthor}>
          ↩️ En réponse à <strong>{replyingTo.sender?.name}</strong>
        </span>
        <p className={styles.replyBannerText}>
          {replyingTo.content?.substring(0, 80)}
          {replyingTo.content?.length > 80 ? '...' : ''}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setReplyingTo(null)}
        className={styles.replyCancelBtn}
      >
        ✕
      </button>
    </div>
  )}

  {/* ✅ APERÇU DU DOCUMENT */}
  {document && (
    <div className={styles.documentPreview}>
      <span className={styles.documentIcon}>📎</span>
      <span className={styles.documentName}>{document.name}</span>
      <span className={styles.documentSize}>
        {formatFileSize(document.size)}
      </span>
      <button
        type="button"
        onClick={() => {
          setDocument(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        className={styles.documentRemoveBtn}
      >
        ✕
      </button>
    </div>
  )}

  {/* ✅ BARRE DE SAISIE */}
  <div className={styles.inputRow}>
    {/* Bouton d'upload */}
    <label className={styles.attachBtn}>
      📎
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.zip,.rar,.7z,image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            if (file.size > 10 * 1024 * 1024) {
              alert('Le fichier est trop volumineux (max 10 Mo)');
              e.target.value = '';
              return;
            }
            setDocument(file);
          }
        }}
        className={styles.fileInput}
        disabled={sending || !isMember}
      />
    </label>

    {/* Champ de saisie */}
    <input
      type="text"
      value={input}
      onChange={handleTyping}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend(e);
        }
      }}
      placeholder={
        document
          ? 'Ajoutez un commentaire (optionnel)'
          : replyingTo
            ? `Répondre à ${replyingTo.sender?.name}...`
            : 'Écrivez un message... (Entrée pour envoyer)'
      }
      className={styles.inputField}
      disabled={sending || !isMember}
    />

    {/* Bouton d'envoi */}
    <button
      type="submit"
      disabled={(!input.trim() && !document) || sending || !isMember}
      className={styles.sendBtn}
    >
      {sending ? (
        <span className={styles.spinnerSmall}></span>
      ) : (
        '→'
      )}
    </button>
  </div>
</form>
```

---

### 3. Fonction utilitaire pour la taille des fichiers

```jsx
// Ajouter cette fonction dans le composant
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
```

---

### 4. handleSend modifié pour accepter les documents

```jsx
const handleSend = async (e) => {
  e.preventDefault();
  if ((!input.trim() && !document) || !isMember || sending) return;

  const content = input.trim();
  const replyToId = replyingTo?._id || null;

  setSending(true);
  sendTypingGroup(id, false);

  // Message temporaire
  const tempMsg = {
    _id: Date.now(),
    content: content || '📎 Document',
    sender: { _id: user._id, name: user.name, avatar: user.avatar },
    createdAt: new Date().toISOString(),
    isTemp: true,
    replyTo: replyingTo || null,
    document: document ? '/uploads/messages/temp' : null,
    documentName: document?.name || null,
    documentType: document ? 'other' : null,
    documentSize: document?.size || null
  };

  setMessages(prev => [...prev, tempMsg]);
  setInput('');
  setReplyingTo(null);

  try {
    const formData = new FormData();
    formData.append('content', content);
    if (document) formData.append('document', document);
    if (replyToId) formData.append('replyTo', replyToId);

    const { data } = await axios.post(`${API}/groups/${id}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    setMessages(prev => prev.map(m => m._id === tempMsg._id ? data : m));
    setDocument(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

  } catch (err) {
    setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
    alert(err.response?.data?.message || 'Erreur lors de l\'envoi');
  } finally {
    setSending(false);
  }
};
```

---

## 📄 CSS COMPLET pour l'input (à ajouter dans GroupChat.module.css)

```css
/* ============================================
   INPUT FORM
============================================ */

.inputForm {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: #181C27;
  border-top: 1px solid #2A2F45;
  flex-shrink: 0;
}

/* ============================================
   INPUT ROW
============================================ */

.inputRow {
  display: flex;
  gap: 10px;
  align-items: center;
  position: relative;
}

/* ============================================
   CHAMP DE SAISIE
============================================ */

.inputField {
  flex: 1;
  background: #1E2336;
  border: 1px solid #2A2F45;
  border-radius: 18px;
  padding: 10px 16px;
  color: #E2E8F0;
  font-size: 14px;
  outline: none;
  transition: all 0.25s ease;
  min-height: 44px;
  font-family: inherit;
}

.inputField::placeholder {
  color: #64748B;
  font-size: 13px;
}

.inputField:focus {
  border-color: #4F8EF7;
  box-shadow: 0 0 0 3px rgba(79, 142, 247, 0.15);
  background: #0F1117;
}

.inputField:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   BOUTON D'ATTACHEMENT (📎)
============================================ */

.attachBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  min-width: 44px;
  background: #1E2336;
  border: 1px solid #2A2F45;
  border-radius: 12px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.25s ease;
  color: #64748B;
  flex-shrink: 0;
}

.attachBtn:hover {
  background: #2A2F45;
  border-color: #4F8EF7;
  color: #E2E8F0;
  transform: scale(1.02);
}

.attachBtn:active {
  transform: scale(0.95);
}

.attachBtn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.fileInput {
  display: none;
}

/* ============================================
   BOUTON D'ENVOI
============================================ */

.sendBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  min-width: 44px;
  background: linear-gradient(135deg, #4F8EF7, #A78BFA);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 20px;
  font-weight: 700;
  color: white;
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.sendBtn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(79, 142, 247, 0.35);
}

.sendBtn:active:not(:disabled) {
  transform: scale(0.92);
}

.sendBtn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

/* ============================================
   SPINNER (petit loader)
============================================ */

.spinnerSmall {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ============================================
   APERÇU DU DOCUMENT
============================================ */

.documentPreview {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #1E2336;
  border: 1px solid #2A2F45;
  border-radius: 10px;
  padding: 8px 14px;
  width: 100%;
  box-sizing: border-box;
}

.documentIcon {
  font-size: 20px;
  flex-shrink: 0;
}

.documentName {
  flex: 1;
  font-size: 13px;
  color: #E2E8F0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.documentSize {
  font-size: 11px;
  color: #64748B;
  flex-shrink: 0;
}

.documentRemoveBtn {
  background: transparent;
  border: none;
  color: #64748B;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.documentRemoveBtn:hover {
  color: #F87171;
  background: rgba(248, 113, 113, 0.1);
}

/* ============================================
   BANDEAU DE RÉPONSE (REPLY)
============================================ */

.replyBanner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(79, 142, 247, 0.08);
  border-left: 3px solid #4F8EF7;
  border-radius: 10px;
  padding: 8px 14px;
  width: 100%;
  box-sizing: border-box;
  animation: slideDown 0.25s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.replyBannerContent {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.replyBannerAuthor {
  font-size: 11px;
  font-weight: 600;
  color: #4F8EF7;
}

.replyBannerAuthor strong {
  font-weight: 700;
}

.replyBannerText {
  font-size: 12px;
  color: #94A3B8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.replyCancelBtn {
  background: transparent;
  border: none;
  color: #64748B;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.replyCancelBtn:hover {
  color: #F87171;
  background: rgba(248, 113, 113, 0.1);
}

/* ============================================
   APERÇU DU MESSAGE CITÉ (dans le message)
============================================ */

.replyPreview {
  background: rgba(79, 142, 247, 0.06);
  border-left: 3px solid #4F8EF7;
  border-radius: 8px;
  padding: 6px 12px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: background 0.2s;
  max-width: 100%;
}

.replyPreview:hover {
  background: rgba(79, 142, 247, 0.12);
}

.replyAuthor {
  font-size: 11px;
  font-weight: 600;
  color: #4F8EF7;
}

.replyContent {
  font-size: 12px;
  color: #94A3B8;
  margin: 2px 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.replyPreviewDeleted {
  background: rgba(248, 113, 113, 0.06);
  border-left: 3px solid #F87171;
  border-radius: 8px;
  padding: 6px 12px;
  margin-bottom: 6px;
  font-size: 12px;
  color: #94A3B8;
}

/* ============================================
   BOUTON RÉPONDRE (dans les actions du message)
============================================ */

.replyBtn {
  background: transparent;
  border: none;
  color: #64748B;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s;
}

.replyBtn:hover {
  background: rgba(79, 142, 247, 0.12);
  color: #4F8EF7;
}

/* ============================================
   RESPONSIVE
============================================ */

@media (max-width: 768px) {
  .inputForm {
    padding: 10px 12px;
  }

  .inputField {
    font-size: 13px;
    padding: 8px 14px;
    min-height: 40px;
    border-radius: 10px;
  }

  .attachBtn,
  .sendBtn {
    width: 40px;
    height: 40px;
    min-width: 40px;
    font-size: 16px;
    border-radius: 10px;
  }

  .replyBanner {
    padding: 6px 10px;
  }

  .replyBannerText {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .inputForm {
    padding: 8px 10px;
    gap: 6px;
  }

  .inputField {
    font-size: 12px;
    padding: 6px 12px;
    min-height: 36px;
    border-radius: 8px;
  }

  .attachBtn,
  .sendBtn {
    width: 36px;
    height: 36px;
    min-width: 36px;
    font-size: 14px;
    border-radius: 8px;
  }

  .documentPreview {
    padding: 6px 10px;
    font-size: 12px;
  }

  .documentName {
    font-size: 12px;
  }

  .replyBanner {
    padding: 4px 10px;
  }

  .replyBannerAuthor {
    font-size: 10px;
  }

  .replyBannerText {
    font-size: 10px;
  }
}
```

---

## Récapitulatif des améliorations

| Élément | Avant | Après |
|---------|-------|-------|
| **Bouton d'upload** | ❌ Absent | ✅ Bouton 📎 avec preview du fichier |
| **Bouton d'envoi** | Simple → | ✅ Dégradé, avec effet hover/active |
| **Champ de saisie** | Classique | ✅ Focus avec glow, fond plus sombre |
| **Bandeau reply** | Simple | ✅ Animé (slideDown), mieux stylisé |
| **Aperçu document** | ❌ Absent | ✅ Nom + taille + bouton supprimer |
| **Loader** | ❌ Absent | ✅ Spinner dans le bouton d'envoi |
| **Responsive** | Partiel | ✅ Adapté tablette et mobile |
| **Effets** | Aucun | ✅ Hover, active, transitions fluides |

---

L'input est maintenant **propre, moderne et agréable à utiliser** comme sur Slack ou Discord ! 🚀