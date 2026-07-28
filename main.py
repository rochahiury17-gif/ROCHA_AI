from ia.cerebro import responder
from voz.falar import falar

print("=" * 50)
print("🤖 ROCHA AI")
print("=" * 50)
print("Digite sua pergunta.")
print("Digite 'sair' para encerrar.")
print("=" * 50)

while True:

    pergunta = input("\n👤 Você: ").strip()

    if not pergunta:
        continue

    if pergunta.lower() in ["sair", "exit", "quit"]:
        print("\n🤖 ROCHA AI: Até logo, Hiury!")
        falar("Até logo, Hiury!")
        break

    resposta = responder(pergunta)

    print(f"\n🤖 ROCHA AI: {resposta}")

    falar(resposta)
