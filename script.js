// Importa as funções do Firestore e do Storage
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, doc, updateDoc, addDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";

// Sua configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAPb-tPYOf0yWiM-lLmd5aPomzth2aiIcY",
  authDomain: "painel-equipe-v2.firebaseapp.com",
  projectId: "painel-equipe-v2",
  storageBucket: "painel-equipe-v2.appspot.com",
  messagingSenderId: "214182969841",
  appId: "1:214182969841:web:a8ff6669b6a73369dc0450"
};

// Inicializa o Firebase e os serviços
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Referências para os elementos do DOM
const teamContainer = document.getElementById('team-container');
const modal = document.getElementById('add-member-modal');
const openModalBtn = document.getElementById('open-add-member-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const addMemberForm = document.getElementById('add-member-form');

// Lógica do Modal
openModalBtn.addEventListener('click', () => modal.classList.add('active'));
closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});

// LÓGICA ATUALIZADA PARA ADICIONAR COLABORADOR
addMemberForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-member-name').value.trim();
    const photoInput = document.getElementById('new-member-photo');
    const file = photoInput.files[0];
    const saveButton = addMemberForm.querySelector('button');

    // O nome ainda é obrigatório
    if (!name) {
        alert("Por favor, preencha o nome do colaborador.");
        return;
    }

    saveButton.disabled = true;
    saveButton.innerText = 'Salvando...';

    // Define uma URL de imagem padrão
    let photoUrl = "https://via.placeholder.com/150/808080/FFFFFF?text=Sem+Foto";

    try {
        // *** INÍCIO DA LÓGICA ALTERADA ***
        // Verifica se um arquivo FOI selecionado
        if (file) {
            saveButton.innerText = 'Enviando foto...';
            // Se sim, faz o upload e obtém a URL real
            const uniqueFileName = Date.now() + '-' + file.name;
            const storageRef = ref(storage, 'collaborator-photos/' + uniqueFileName);
            const uploadResult = await uploadBytes(storageRef, file);
            photoUrl = await getDownloadURL(uploadResult.ref);
        }
        // Se nenhum arquivo foi selecionado, a photoUrl continua sendo a imagem padrão.
        // *** FIM DA LÓGICA ALTERADA ***

        // Salva os dados no Firestore (com a URL real ou a padrão)
        await addDoc(collection(db, 'team-commitments'), {
            name: name,
            photoUrl: photoUrl,
            commitment: "",
            createdAt: serverTimestamp()
        });

        addMemberForm.reset();
        modal.classList.remove('active');

    } catch (error) {
        console.error("Erro ao adicionar colaborador: ", error);
        alert("Não foi possível adicionar o colaborador. Verifique o console para mais detalhes.");
    } finally {
        saveButton.disabled = false;
        saveButton.innerText = 'Salvar Colaborador';
    }
});


// NENHUMA DAS FUNÇÕES ABAIXO PRECISA MUDAR!

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
    card.id = docId;

    card.innerHTML = `
        <img src="${data.photoUrl}" alt="Foto de ${data.name}">
        <h2>${data.name}</h2>
        <textarea placeholder="Digite seus compromissos aqui...">${data.commitment || ''}</textarea>
        <button>Salvar</button>
    `;

    const saveButton = card.querySelector('button');
    const textarea = card.querySelector('textarea');
    saveButton.addEventListener('click', () => {
        updateCommitment(docId, textarea.value);
        saveButton.innerText = 'Salvo!';
        setTimeout(() => { saveButton.innerText = 'Salvar'; }, 2000);
    });

    return card;
};

// "Ouve" a coleção e reage a adições, modificações e remoções
const listenForChanges = () => {
    const q = collection(db, "team-commitments");
    onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const docId = change.doc.id;
            const data = change.doc.data();

            if (change.type === "added") {
                const newCard = createMemberCard(docId, data);
                teamContainer.appendChild(newCard);
            }
            if (change.type === "modified") {
                const cardToUpdate = document.getElementById(docId);
                if (cardToUpdate) {
                    cardToUpdate.querySelector('img').src = data.photoUrl;
                    cardToUpdate.querySelector('h2').innerText = data.name;
                    cardToUpdate.querySelector('textarea').value = data.commitment;
                }
            }
            if (change.type === "removed") {
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
