# Criando o repositório da equipe no GitHub

O ZIP não cria nem publica o repositório automaticamente. Para publicar:

1. Acesse https://github.com/new, autentique-se e crie um repositório chamado `urbanguard-gs-2026-2` **sem** README inicial (já incluído no pacote).
2. Abra o terminal do VS Code na **pasta raiz** `UrbanGuard_GS_2026_2`.
3. Rode, um comando por vez:

```powershell
git init
git add .
git commit -m "feat: estrutura inicial UrbanGuard backend e mobile"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/urbanguard-gs-2026-2.git
git push -u origin main
```

4. Substitua **SEU-USUARIO** pelo usuário/repositório real. Se o Git pedir autenticação, entre pela conta da equipe.
5. Após executar e testar com colegas, faça commits **verdadeiros** para correções, README, refinamentos de UX e testes. Ex.: `git add .` + `git commit -m "test: validar reconexao no aparelho"` + `git push`.
6. Copie a URL HTTPS do GitHub e preencha `ENTREGA_FIAP_PREENCHER.txt`.

**Não crie commits fictícios em nome de integrantes**. O enunciado exige evolução real do grupo.
