// Importa as funções necessárias do Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, onSnapshot, serverTimestamp, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Sua configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAkNc2ogIZ07ml4d5KAkp1GpsJYd2ODXow",
  authDomain: "painel-equipe.firebaseapp.com",
  projectId: "painel-equipe",
  storageBucket: "painel-equipe.firebasestorage.app",
  messagingSenderId: "171971329910",
  appId: "1:171971329910:web:d491ee21938e0f7f460457"
};

// Inicializa o Firebase e o Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referências para os elementos do DOM
const teamContainer = document.getElementById('team-container');
const modal = document.getElementById('add-member-modal');
const openModalBtn = document.getElementById('open-add-member-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const addMemberForm = document.getElementById('add-member-form');

// --- LÓGICA DO MODAL ---
openModalBtn.addEventListener('click', () => modal.classList.add('active'));
closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});

// --- FUNÇÕES DO FIREBASE ---

// Função para CRIAR um novo colaborador no banco de dados
addMemberForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-member-name').value;
    const photoUrl = document.getElementById('new-member-photo').value;

    if (name && photoUrl) {
        try {
            // Adiciona um novo documento com um ID gerado automaticamente
            await addDoc(collection(db, 'team-commitments'), {
                name: name,
                photoUrl: photoUrl,
                commitment: "", // Começa com compromisso vazio
                createdAt: serverTimestamp()
            });
            addMemberForm.reset();
            modal.classList.remove('active');
        } catch (error) {
            console.error("Erro ao adicionar colaborador: ", error);
            alert("Não foi possível adicionar o colaborador.");
        }
    }
});

// Função para ATUALIZAR o compromisso de um colaborador
const updateCommitment = (docId, text) => {
    const docRef = doc(db, 'team-commitments', docId);
    updateDoc(docRef, {
        commitment: text,
        lastUpdated: serverTimestamp()
    }).catch(error => console.error("Erro ao atualizar compromisso: ", error));
};

// Função para criar o HTML de um cartão de colaborador
const createMemberCard = (docId, data) => {
    const card = document.createElement('div');
    card.className = 'team-member-card';
    card.id = docId; // O ID do card é o mesmo do documento no Firestore

    card.innerHTML = `
        <img src="${data.photoUrl}" alt="Foto de ${data.name}">
        <h2>${data.name}</h2>
        <textarea placeholder="Digite seus compromissos aqui...">${data.commitment || ''}</textarea>
        <button>Salvar</button>
    `;

    // Adiciona o evento de 'salvar' para este card específico
    const saveButton = card.querySelector('button');
    const textarea = card.querySelector('textarea');
    saveButton.addEventListener('click', () => {
        updateCommitment(docId, textarea.value);
        saveButton.innerText = 'Salvo!';
        setTimeout(() => { saveButton.innerText = 'Salvar'; }, 2000);
    });

    return card;
};


// --- CARREGAMENTO EM TEMPO REAL ---
// "Ouve" a coleção e reage a adições, modificações e remoções de colaboradores
const listenForChanges = () => {
    const q = collection(db, "team-commitments");
    onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const docId = change.doc.id;
            const data = change.doc.data();

            if (change.type === "added") {
                // Se um colaborador foi adicionado, cria o card e anexa ao container
                const newCard = createMemberCard(docId, data);
                teamContainer.appendChild(newCard);
            }
            if (change.type === "modified") {
                // Se foi modificado, encontra o card e atualiza seu conteúdo
                const cardToUpdate = document.getElementById(docId);
                if (cardToUpdate) {
                    cardToUpdate.querySelector('img').src = data.photoUrl;
                    cardToUpdate.querySelector('h2').innerText = data.name;
                    cardToUpdate.querySelector('textarea').value = data.commitment;
                }
            }
            if (change.type === "removed") {
                // Se foi removido, encontra o card e o remove da página
                const cardToRemove = document.getElementById(docId);
                if (cardToRemove) {
                    cardToRemove.remove();
                }
            }
        });
    });
};

// Inicia a "escuta" por mudanças no banco de dados
listenForChanges();