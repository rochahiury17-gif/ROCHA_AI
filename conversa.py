from ia.cerebro import responder
from voz.falar import falar
from voz.ouvir import ouvir
from ativador import ativar
from ia.corretor import corrigir


print("🤖 ROCHA AI modo conversa ativado!")

ativa = False


while True:

    print("\n🎤 Fale alguma coisa...")

    texto = ouvir()

    if not texto:
        continue

    print("Você:", texto)

    texto = corrigir(texto)

    print("Corrigido:", texto)


    if not ativa:

        if ativar(texto):
            print("ATIVADOR FUNCIONOU!")
            ativa = True
            falar("Estou ouvindo Hiury.")

        continue


    if "sair" in texto.lower():
        falar("Até logo Hiury.")
        break


    resposta = responder(texto)

    print("ROCHA AI:", resposta)

    falar(resposta)
