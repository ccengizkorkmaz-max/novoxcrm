import { getBrokerLevels } from '@/app/broker/actions'
import LevelManager from './components/LevelManager'

export default async function BrokerLevelsPage() {
    const levels = await getBrokerLevels()

    return (
        <div className="container py-6">
            <LevelManager levels={levels} />
        </div>
    )
}
