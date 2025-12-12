import zen
from pathlib import Path

graph_json = Path(__file__).parent / "multi2.json"
# Example filesystem content, it is up to you how you obtain content
with open(graph_json, "r") as f:
  content = f.read()

engine = zen.ZenEngine()

decision = engine.create_decision(content)
result = decision.evaluate({"num": 15})
# print(result)