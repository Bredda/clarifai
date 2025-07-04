from pydantic import BaseModel, Field
from typing import Literal

class Segment(BaseModel):
    """Représente un segment de texte extrait du contenu original."""
    content: str = Field(..., description="Le contenu textuel du segment")
    id: int = Field(..., description="Un identifiant unique pour le segment")

## CLAIMS

class Claim(BaseModel):
    """Représente une affirmation factuelle extraite du texte."""
    content: str = Field(..., description="L'affirmation factuelle extraite du texte")
    segment_id: int = Field(..., description="Identifiant du segment d'où l'affirmation a été extraite")


class Claims(BaseModel):
    """Représente une collection d'affirmations factuelles extraites du texte."""
    items: list[Claim] = Field(..., description="Liste des affirmations extraites du texte")
    
    def format_for_prompt(self) -> str:
        return "\n".join(
            [f"id: {claim.segment_id} - content: {claim.content}" for claim in self.items])

## BIASES

class Bias(BaseModel):
    """Représente un biais détecté dans le texte."""
    content: str = Field(..., description="Le biais détecté dans le texte")
    segment_id: int = Field(..., description="Identifiant du segment d'où le biais a été extrait")
    bias_type: str = Field(..., description="Le type de biais détecté (émotionnel, idéologique, exagération, omission, autre...)")
    explanation: str = Field(..., description="Justification brève du biais détecté")
    
class Biases(BaseModel):
    """Représente une collection de biais détectés dans le texte."""
    items: list[Bias] = Field(..., description="Liste des biais détectés dans le texte")


    def format_for_prompt(self) -> str:
        return ("\n").join([f"segment_id: {bias.segment_id} - content: {bias.content} - type: {bias.bias_type} - explanation: {bias.explanation}" for bias in self.items])
## VERIFIED CLAIMS

class VerifiedClaim(BaseModel):
    """Représente une affirmation factuelle vérifiée."""
    content: str = Field(..., description="L'affirmation factuelle extraite du texte")
    segment_id: int = Field(..., description="Identifiant du segment d'où l'affirmation a été extraite")
    verdict: Literal["true", "false", "partially_true", "unverifiable"] = Field(..., description="Le verdict de vérification de l'affirmation")
    explanation: str = Field(..., description="Explication brève et factuelle du verdict")
    sources: list[str] = Field(..., description="Liste des sources ou connaissances utilisées pour la vérification de l'affirmation")

class VerifiedClaims(BaseModel):
    """Représente une collection d'affirmations factuelles vérifiées."""
    items: list[VerifiedClaim] = Field(..., description="Liste des vérifications des affirmations factuelles")

    def format_for_prompt(self) -> str:
        return ("\n").join([f"segment_id: {claim.segment_id} - content: {claim.content} - verdict: {claim.verdict} - explanation: {claim.explanation}" for claim in self.items])


class AnalyzedSegment(BaseModel):
    """Représente un segment de texte analysé avec ses affirmations et biais."""
    content: str = Field(..., description="Le contenu textuel du segment")
    id: int = Field(..., description="Un identifiant unique pour le segment")
    biases: list[Bias] = Field(default_factory=list, description="Liste des biais détectés dans le segment")
    claims: list[Claim] = Field(default_factory=list, description="Liste des affirmations factuelles extraites du segment")

